import { Setting } from "./models";
import { formatIssueCounter } from "./utils";

export async function generateIssueId() {
  const year = new Date().getFullYear();
  const counter = await Setting.findOneAndUpdate(
    { key: `issueCounter.${year}` },
    {
      $inc: { "value.sequence": 1 },
      $setOnInsert: { description: `Issue ID counter for ${year}` },
    },
    { upsert: true, new: true, lean: true },
  );

  const value = counter?.value as { sequence?: number } | undefined;
  return `ERP-${year}-${formatIssueCounter(value?.sequence ?? 1)}`;
}

export async function generateActionId() {
  const year = new Date().getFullYear();
  const counter = await Setting.findOneAndUpdate(
    { key: `improvementActionCounter.${year}` },
    {
      $inc: { "value.sequence": 1 },
      $setOnInsert: { description: `Improvement action counter for ${year}` },
    },
    { upsert: true, new: true, lean: true },
  );

  const value = counter?.value as { sequence?: number } | undefined;
  return `ACT-${year}-${formatIssueCounter(value?.sequence ?? 1)}`;
}
