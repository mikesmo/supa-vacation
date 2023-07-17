import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import CognitoProvider from "next-auth/providers/cognito";
import nodemailer from 'nodemailer';
import CredentialsProvider from "next-auth/providers/credentials"

import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';

const { CognitoIdentityProviderClient, SignUpCommand } = require("@aws-sdk/client-cognito-identity-provider");
const crypto = require("crypto-js");

function hashSecret(clientSecret, username, clientId) {
  return crypto.HmacSHA256(username + clientId, clientSecret).toString(crypto.enc.Base64);
}

async function signUpUser(email, password) {
  let clientId = process.env.COGNITO_CLIENT_ID
  let clientSecret = process.env.COGNITO_CLIENT_SECRET
  let region = process.env.AWS_REGION
  console.log({clientId, clientSecret, region})

  var params = {
    ClientId: clientId,
    Password: password,
    Username: email,
    SecretHash: hashSecret(clientSecret, email, clientId),
    UserAttributes: [
      {
        Name: 'email',
        Value: email,
      },
    ],
  }

  console.log({params})

  const client = new CognitoIdentityProviderClient({region});

  try {
    const command = new SignUpCommand(params);
    const response = await client.send(command);
    return response;
  } catch (err) {
    console.error('Error signing up user:', err);
    throw err;
  }
}


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
        CredentialsProvider({
          // The name to display on the sign in form (e.g. 'Sign in with...')
          name: 'Credentials',
          // The credentials is used to generate a suitable form on the sign in page.
          // You can specify whatever fields you are expecting to be submitted.
          // e.g. domain, username, password, 2FA token, etc.
          // You can pass any HTML attribute to the <input> tag through the object.
          credentials: {
            username: { label: "Username", type: "text", placeholder: "jsmith" },
            password: { label: "Password", type: "password" }
          },
          async authorize(credentials) {
            let user = {}
            console.log({credentials}) 
            // Example usage:
            try {
              let data = await signUpUser(credentials.email, credentials.password, credentials.username)
              
              console.log('User signed up successfully:', data);
              console.log(data.UserSub)
              user.id = data.UserSub
              user.email = credentials.email
              console.log("user")
              console.log({user})
              return user;  
            }
            catch(err) {
              console.error('Error signing up user:', err);
            }   
          }
        })
      ],
    debug: true,
    callbacks: {
      async jwt({ token, user }) {
        user && (token.user = user);
        return token;
      },
      async session({ session, token }) {
        session.user = token.user;
        return session;
      },
    },
    session: {
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60 // 30 days
    },
    adapter: PrismaAdapter(prisma),
  });