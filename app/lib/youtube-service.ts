import { google, youtube_v3 } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import { getCachedRecommendations, getRecommendedCourses } from '~/utils/helperFunctions';

const prisma = new PrismaClient();

// Initialize YouTube API
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

// Rate limiting setup
let requestCount = 0;
const RATE_LIMIT = parseInt(process.env.YOUTUBE_RATE_LIMIT || '100');
const RATE_LIMIT_WINDOW = 60000; // 1 minute

setInterval(() => {
  requestCount = 0;
}, RATE_LIMIT_WINDOW);

async function checkRateLimit(): Promise<void> {
  if (requestCount >= RATE_LIMIT) {
    throw new Error('YouTube API rate limit exceeded');
  }
  requestCount++;
}

export interface RecommendedCourse {
  id: string;
  title: string;
  channelTitle: string;
  description: string;
  thumbnail: string;
  url: string;
  duration: string;
  viewCount: number;
  publishedAt: string;
  relevance: 'High' | 'Medium' | 'Low';
  skills: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  playlist?: boolean;
}

// ... [All the functions from previous implementation] ...

export { getRecommendedCourses, getCachedRecommendations };