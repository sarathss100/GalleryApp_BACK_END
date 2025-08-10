import { Request, Response } from "express";

interface IUserController {
    signup(req:Request,res:Response): Promise<void>;
    verifyCache(req:Request,res:Response): Promise<void>;
    forgotPassword(req:Request,res:Response): Promise<void>;
    resetPassword(req:Request,res:Response): Promise<void>;
    signin(req:Request,res:Response): Promise<void>;
    refreshToken(req:Request,res:Response): Promise<void>;
    logout(req:Request,res:Response): Promise<void>;
}

export default IUserController;