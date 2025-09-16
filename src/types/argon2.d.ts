declare module 'argon2' {
    // Define the types you need here
    export function hash(password: string, options?: any): Promise<string>;
    export function verify(hash: string, password: string): Promise<boolean>;
    // Add other methods as needed
  }