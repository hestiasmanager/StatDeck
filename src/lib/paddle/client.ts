import { Environment, Paddle } from "@paddle/paddle-node-sdk";

const apiKey = process.env.PADDLE_API_KEY || "test_api_key";
const environment =
  process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
    ? Environment.production
    : Environment.sandbox;

export const paddle = new Paddle(apiKey, {
  environment,
});

export const PADDLE_PRICES = {
  creatorMonthly: process.env.PADDLE_CREATOR_PRICE_ID || "pri_creator_sample",
  agencyMonthly: process.env.PADDLE_AGENCY_PRICE_ID || "pri_agency_sample",
};
