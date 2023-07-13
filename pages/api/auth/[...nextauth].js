import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import CognitoProvider from "next-auth/providers/cognito";
import nodemailer from 'nodemailer';

import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';

// Instantiate Prisma Client
const prisma = new PrismaClient();

export default NextAuth({
    pages: {
        signIn: '/',
        signOut: '/',
        error: '/',
        verifyRequest: '/',
      },
    providers: [
      CognitoProvider({
        clientId: process.env.COGNITO_CLIENT_ID,
        clientSecret: process.env.COGNITO_CLIENT_SECRET,
        issuer: process.env.COGNITO_DOMAIN,
      }),
    ],
    debug: true,
    adapter: PrismaAdapter(prisma),
  });