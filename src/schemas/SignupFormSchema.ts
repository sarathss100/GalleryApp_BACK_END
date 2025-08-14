import { z } from 'zod';

const phoneRegex = /^\+?[\d\s-]{10,}$/;

const passwordStrengthRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&^])[A-Za-z\d@$!%*?#&^]{8,}$/;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SignupFormSchema = z.object({
    username: z
        .string()
        .trim()
        .min(3, 'Username is required')
        .max(50, 'Username must not exceed 50 characters'),
    email: z
        .string()
        .trim()
        .min(1, 'Email is required')
        .regex(emailRegex, 'Invalid email format'),
    phoneNumber: z
        .string()
        .trim()
        .min(1, 'Phone number is required')
        .regex(phoneRegex, 'Invalid phone number format'),
    password: z 
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
            passwordStrengthRegex,
            "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character"
        ),
    confirmPassword: z  
        .string()
        .min(1, 'Confirm Password is required'),
})
.refine(
    (data) => data.password === data.confirmPassword,
    {
        message: "Password do not match",
        path: ["confirmPassword"],
    }
);

export default SignupFormSchema;