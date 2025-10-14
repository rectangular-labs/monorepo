import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { Progress } from "@rectangular-labs/ui/components/ui/progress";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { createFileRoute, Link } from "@tanstack/react-router";
import { questionSteps } from "./-lib/steps";
import type { QuizState } from "./-lib/use-quiz-metadata";

export const Route = createFileRoute("/_marketing/quiz/results")({
  component: ResultsPage,
});

function loadState(): QuizState | null {
  try {
    const raw = sessionStorage.getItem("seo-quiz-v1");
    if (!raw) return null;
    return JSON.parse(raw) as QuizState;
  } catch {
    return null;
  }
}

function score(state: QuizState) {
  let total = 0;
  let count = 0;
  const byCategory: Record<string, number[]> = {};
  const insights: {
    id: string;
    message: string;
    impactWeight: number;
    category: string;
  }[] = [];

  for (const q of questionSteps) {
    const ans = state.answers.find((a) => a.questionId === q.question.id);
    if (!ans) continue;
    const opt = q.question.options.find((o) => o.value === ans.value);
    if (!opt) continue;
    total += opt.score;
    count += 1;
    const cat = q.question.category;
    const arr = byCategory[cat] ?? [];
    arr.push(opt.score);
    byCategory[cat] = arr;
    if (opt.insights) insights.push(...opt.insights);
  }

  const overall = count ? Math.round((total / (count * 10)) * 100) : 0;
  const subs = Object.fromEntries(
    Object.entries(byCategory).map(([k, arr]) => [
      k,
      Math.round((arr.reduce((a, b) => a + b, 0) / (arr.length * 10)) * 100),
    ]),
  );

  insights.sort((a, b) => b.impactWeight - a.impactWeight);

  return { overall, subs, insights } as const;
}

function ResultsPage() {
  const state = loadState();
  if (!state) {
    return (
      <Section>
        <div className="container mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>No results found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Please take the quiz first.
              </p>
              <div className="mt-4">
                <Button asChild>
                  <Link to="/quiz">Go to quiz</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>
    );
  }

  const { overall, subs, insights } = score(state);
  const top3 = insights.slice(0, 3);
  const website = state.qualifying.websiteUrl ?? "";

  const qualifiedForChallenge =
    overall >= 60 &&
    (state.qualifying.desired === "Leads" ||
      state.qualifying.desired === "Sales");

  return (
    <Section>
      <div className="container mx-auto grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>The big reveal</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="font-semibold text-4xl tracking-tight">
              Your score: {overall}/100
            </div>
            <div className="grid gap-2">
              <div>Technical</div>
              <Progress value={subs.Technical ?? 0} />
            </div>
            <div className="grid gap-2">
              <div>On‑page</div>
              <Progress value={subs.OnPage ?? 0} />
            </div>
            <div className="grid gap-2">
              <div>Content</div>
              <Progress value={subs.Content ?? 0} />
            </div>
            <div className="grid gap-2">
              <div>Authority</div>
              <Progress value={subs.Authority ?? 0} />
            </div>
            <div className="grid gap-2">
              <div>Tracking</div>
              <Progress value={subs.Tracking ?? 0} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3 key insights</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {top3.map((i) => (
              <div className="rounded-md border p-4" key={i.id}>
                <div className="text-muted-foreground text-sm">
                  {i.category}
                </div>
                <div className="font-medium">{i.message}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next steps</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="text-muted-foreground">
              A simple framework to act now:
            </div>
            <ul className="list-disc pl-6">
              <li>This week: ship quick wins from your top insights.</li>
              <li>Next 2 weeks: fix critical technical/on‑page blockers.</li>
              <li>Next 90 days: publish consistently and build authority.</li>
            </ul>
            {qualifiedForChallenge ? (
              <div className="mt-2">
                <Button asChild>
                  <Link to="/onboarding">Start the 1k Challenge</Link>
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div>Website: {website}</div>
            <div>Email: {state.qualifying.email ?? ""}</div>
            <div>
              Prefer a call? <Link to="/onboarding">Start here</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}
