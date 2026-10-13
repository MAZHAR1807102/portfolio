/*
  Blog post list. The home page shows the newest three; blog/index.html shows them all.

  To publish a post:
    1. Copy blog/_template.html to blog/<slug>.html and write the post there.
    2. Add an entry at the TOP of this list (newest first):

    {
      slug: "my-first-post",              // file name without .html
      title: "My first post",
      date: "2026-10-08",                 // YYYY-MM-DD
      summary: "One or two sentences shown on the card.",
      tags: ["Teaching", "Security"],
      minutes: 4                          // reading time
    },

  A post published elsewhere (Medium, LinkedIn, ...) can use `url` instead of `slug`;
  its card opens that page in a new tab:

    { url: "https://medium.com/...", title: "...", date: "2026-09-01", summary: "...", tags: ["Medium"] },
*/
window.POSTS = [
];
