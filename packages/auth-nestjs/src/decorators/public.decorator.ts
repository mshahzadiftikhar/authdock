import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'authdock:isPublic';

/** Marks a route as not requiring a session — use on login/signup/verify/reset endpoints. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
