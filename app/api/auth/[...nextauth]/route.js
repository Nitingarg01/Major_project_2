import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const client = await clientPromise;
        const db = client.db('Cluster0');
        const user = await db.collection('users').findOne({ email: credentials.email });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const client = await clientPromise;
        const db = client.db('Cluster0');
        const existingUser = await db.collection('users').findOne({ email: user.email });

        if (!existingUser) {
          await db.collection('users').insertOne({
            id: uuidv4(),
            email: user.email,
            name: user.name,
            googleId: account.providerAccountId,
            image: user.image,
            createdAt: new Date(),
          });
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        const client = await clientPromise;
        const db = client.db('Cluster0');
        const user = await db.collection('users').findOne({ email: session.user.email });
        if (user) {
          session.user.id = user.id;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
