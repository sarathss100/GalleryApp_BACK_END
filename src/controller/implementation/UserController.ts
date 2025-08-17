import { Request, Response } from "express";
import IUserService from "../../service/IUserService";
import IUserController from "../interfaces/IUserControler";
import { STATUS_CODES } from "../../constants/statusCode";
import PasswordUtils from "../../utils/passwordUtils";
import MailUtility from "../../utils/mailUtilits";
import { IUser } from "../../model/user.model";
import { Token } from "../../utils/tokenUtility";
import jwt, { JwtPayload } from 'jsonwebtoken'
import SignupFormSchema from "../../schemas/SignupFormSchema";
import SigninFormSchema from "../../schemas/SigninFormSchema";

const isProduction = process.env.NODE_ENV === 'production';

class UserController implements IUserController {
    private _userService: IUserService;
    constructor(userService: IUserService) {
        this._userService = userService;
    }

    async signup(req: Request, res: Response): Promise<void> {
        try {
            const parsed = SignupFormSchema.safeParse(req.body);

            if (!parsed.success) {
                const errorMessages = parsed.error.issues.map(err => ({
                    field: err.path[0],
                    message: err.message
                }));
                res.status(STATUS_CODES.BAD_REQUEST).json({
                    success: false,
                    errors: errorMessages
                });
                return;
            }

            const { username, email, phoneNumber } = parsed.data;
            let { password } = parsed.data;

            const existingUser = await this._userService.findByEmail(email);

            if (existingUser && existingUser.isVerified) {
                res.status(STATUS_CODES.CONFLICT).json({ success: false, message: "User already exists" });
                return;
            }

            if (existingUser?.isVerified == false) {
                res.status(STATUS_CODES.CONFLICT).json({ success: false, message: "User already exists, But User Cache not verified for sign up , Try to signup again after 10 minutes" });
                return;
            }

            const phone_number = parseInt(phoneNumber);

            const userPhoneNumberExist = await this._userService.findByPhoneNumber(phone_number);
            if (userPhoneNumberExist) {
                res.status(STATUS_CODES.CONFLICT).json({ success: false, message: "User with this phone number already exists" });
                return;
            }

            const hashedPassword = await PasswordUtils.passwordHash(password);
            if (!hashedPassword) {
                res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error hashing password" });
                return;
            }

            password = hashedPassword;

            const newUser = {
                username,
                email,
                phoneNumber,
                password,
                isVerified: false
            }

            const user = await this._userService.createUser(newUser as IUser);

            if (!user) {
                res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error creating user" });
                return;
            }

            const cacheCode = Math.random().toString(36).substring(2, 8);
            const expiresIn = 10 * 60 * 1000;
            const updatedUser = await this._userService.updateUser(email, {
                cacheCode,
                cacheCodeExpires: new Date(Date.now() + expiresIn)
            });
            if (updatedUser) {
                await MailUtility.sendMail(email, cacheCode, "Verification otp")
                res.status(STATUS_CODES.OK).json({ success: true, message: "Verification code sent to email" });
                return
            }

        } catch (error) {
            console.error("Error in signup:", error);
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
        }
    }

    async verifyCache(req: Request, res: Response): Promise<void> {
        try {
            const { email, cacheCode } = req.body;
            const userExists = await this._userService.findByEmail(email);
            if (!userExists) {
                res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: "User not found" });
                return;
            }
            const userCacheCode = userExists?.cacheCode;
            const userCacheCodeExpires = userExists?.cacheCodeExpires;
            
            if (userCacheCode !== cacheCode || !userCacheCodeExpires || userCacheCodeExpires < new Date()) {
                res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: "Invalid or expired verification code" });
                return;
            }

            const updatedUser = await this._userService.updateUser(email, {
                isVerified: true
            } as Partial<IUser>);
            if (!updatedUser) {
                res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error verifying user" });
                return;
            }
            const tokenInstance = new Token();
            const { accessToken, refreshToken } = tokenInstance.generatingTokens(userExists.id, userExists.email);
            if (!accessToken || !refreshToken) {
                res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error generating tokens" });
                return;
            }
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? "none" : "lax",
                domain: isProduction ? process.env.FRON_END_URL : undefined,
                path: '/',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            
            res.cookie("accessToken", accessToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? "none" : "lax",
                domain: isProduction ? process.env.FRON_END_URL : undefined,
                path: '/',
                maxAge: 15 * 60 * 1000,
            });
    
            const filteredUser = {
                id: userExists.id,
                email: userExists.email,
                accessToken
            };

            res.status(STATUS_CODES.OK).json({ success: true, message: "Sign up successfully", data: filteredUser });

        } catch (error) {
            console.error("Error in verify cache:", error);
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
        }
    }

    async forgotPassword(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;
    
            if (!email) {
                res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "Email is required" });
                return;
            }
            const userExists = await this._userService.findByEmail(email);
            if (!userExists) {
                res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: "User not found" });
                return;
            }

            const cacheCode = Math.random().toString(36).substring(2, 8);

            const expiresIn = 10 * 60 * 1000;

            const updatedUser = await this._userService.updateUser(email, {
                cacheCode,
                cacheCodeExpires: new Date(Date.now() + expiresIn)
            });

            if (updatedUser) {
                await MailUtility.sendMail(email, cacheCode, "Verification otp")
                res.status(STATUS_CODES.OK).json({ success: true, message: "Verification code sent to email" });
                return
            }
        } catch (error) {
            console.error("Error in forgotPassword:", error);
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
        }
    }

    async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            const { email, password, cacheCode } = req.body;
            
            if (!email || !password || !cacheCode) {
                res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "Email and new password are required" });
                return;
            }
            const userExists = await this._userService.findByEmail(email);
            if (!userExists) {
                res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: "User not found" });
                return;
            }
            const userCacheCode = userExists?.cacheCode;
            const userCacheCodeExpires = userExists?.cacheCodeExpires;
            if (userCacheCode !== cacheCode || !userCacheCodeExpires || userCacheCodeExpires < new Date()) {
                res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: "Invalid or expired verification code" });
                return;
            }
            const hashedPassword = await PasswordUtils.passwordHash(password);
            if (!hashedPassword) {
                res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error hashing password" });
                return;
            }
            const updatedUser = await this._userService.updateUser(email, {
                password: hashedPassword
            } as Partial<IUser>);
            if (!updatedUser) {
                res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error updating password" });
                return;
            }
            res.status(STATUS_CODES.OK).json({ success: true, message: "Password reset successfully" });
        } catch (error) {
            console.error("Error in resetPassword:", error);
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });

        }
    }

    async signin(req: Request, res: Response): Promise<void> {
        try {
            const parsed = SigninFormSchema.safeParse(req.body);

            if (!parsed.success) {
                const errorMessages = parsed.error.issues.map(err => ({
                    field: err.path[0],
                    message: err.message
                }));
                res.status(STATUS_CODES.BAD_REQUEST).json({
                    success: false,
                    errors: errorMessages
                });
                return;
            }

            const { email, password } = parsed.data;

            const userExists = await this._userService.findByEmail(email);
            if (!userExists?.isVerified) {
                res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: "Cache Not Verified" });
                return;
            }
            if (!userExists) {
                res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: "User not found" });
                return;
            }
            const isPasswordValid = await PasswordUtils.comparePassword(password, userExists?.password);
            if (!isPasswordValid) {
                res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: "Invalid password" });
                return;
            }
            const tokenInstance = new Token();
            const { accessToken, refreshToken } = tokenInstance.generatingTokens(userExists.id, userExists.email);
            if (!accessToken || !refreshToken) {
                res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error generating tokens" });
                return;
            }
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? "none" : "lax",
                domain: isProduction ? process.env.FRON_END_URL : undefined,
                path: '/',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            res.cookie("accessToken", accessToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? "none" : "lax",
                domain: isProduction ? process.env.FRON_END_URL : undefined,
                path: '/',
                maxAge: 15 * 60 * 1000,
            });

            const filteredUser = {
                id: userExists.id,
                email: userExists.email,
                accessToken
            };

            res.status(STATUS_CODES.OK).json({ success: true, message: "Signin successful", data: filteredUser });
        } catch (error) {
            console.error("Error in signin:", error);
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
        }
    }

    async refreshToken(req: Request, res: Response): Promise<void> {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: 'Refresh token missing' });
                return
            }

            jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string, (err: unknown, decoded: JwtPayload | string | undefined) => {
                if (err) {
                    return res.status(STATUS_CODES.FORBIDDEN).json({ success: false, message: 'Invalid refresh token' });
                }

                const tokenInstance = new Token();
                const { role, userId } = decoded as { role: string, userId: string }
                const newAccessToken = tokenInstance.generatingTokens(userId, role).accessToken;
                res.cookie("accessToken", newAccessToken, {
                    httpOnly: true,
                    secure: isProduction,
                    sameSite: isProduction ? "none" : "lax",
                    domain: isProduction ? process.env.FRON_END_URL : undefined,
                    path: '/',
                    maxAge: 15 * 60 * 1000,
                });

                res.status(STATUS_CODES.OK).json({ success: true, accessToken: newAccessToken });
            });
        } catch (error) {
            console.error('Error refreshing token:', error);
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "error while refreshing token" });
        }
    };


    async logout(req: Request, res: Response): Promise<void> {
        try {
            res.clearCookie("accessToken", {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? "none" : "lax",
                domain: isProduction ? process.env.FRON_END_URL : undefined,
                path: '/'
            });
            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? "none" : "lax",
                domain: isProduction ? process.env.FRON_END_URL : undefined,
                path: '/'
            });
            res.status(STATUS_CODES.OK).json({
                success: true,
                message: "Logout successful",
            });
            return
        } catch (error) {
            console.error("Logout error:", error);
            res.status(STATUS_CODES.BAD_REQUEST).json({ error: "logout failed" });
            return
        }
    }
}

export default UserController;