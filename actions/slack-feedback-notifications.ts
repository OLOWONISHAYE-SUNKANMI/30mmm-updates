// lib/slack.ts
export async function sendSlackNotification(feedback: {
  title: string;
  text: string;
  type: string;
  url?: string;
}) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const typeEmoji =
    feedback.type === "bug" ? "🐛" : feedback.type === "feature" ? "💡" : "💬";

  const payload = {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*New ${feedback.type.toUpperCase()} Feedback Received!* ${typeEmoji}`,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Title:*\n${feedback.title}` },
          { type: "mrkdwn", text: `*Type:*\n${feedback.type}` },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Description:*\n${feedback.text}`,
        },
      },
      feedback.url
        ? {
            type: "context",
            elements: [{ type: "mrkdwn", text: `📍 *URL:* ${feedback.url}` }],
          }
        : null,
    ].filter(Boolean),
  };

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
