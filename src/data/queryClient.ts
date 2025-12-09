import { QueryClient } from "@tanstack/react-query";

// big ol' singleton! this lets us invalidate, e.g., 'lesson finished' state even from outside the react tree.
// it also lets us invalidate queries from the asyncstorage 'server' side, e.g., when a download finishes,
//   this is not typically something the react client would be able to get a notification of, but here we
//   can do it, so why not? better than polling

export const queryClient = new QueryClient();
