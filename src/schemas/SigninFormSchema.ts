import { z } from 'zod';

const passwordStrengthRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&^])[A-Za-z\d@$!%*?#&^]{8,}$/;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SigninFormSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, 'Email is required')
        .regex(emailRegex, 'Invalid email format'),
    password: z 
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
            passwordStrengthRegex,
            "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character"
        ),
});

export default SigninFormSchema;