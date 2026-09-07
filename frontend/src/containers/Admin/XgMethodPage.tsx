import type { ReactNode } from "react";
import { Card } from "@/components/Card/Card";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card padding="lg">
      <Stack gap="sm">
        <Text variant="title">{title}</Text>
        {children}
      </Stack>
    </Card>
  );
}

function P({ children }: { children: ReactNode }) {
  return (
    <Text tone="muted" variant="body">
      {children}
    </Text>
  );
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item, index) => (
        <li key={index}>
          <Text tone="muted" variant="body">
            {item}
          </Text>
        </li>
      ))}
    </ul>
  );
}

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="list-decimal space-y-1 pl-5">
      {items.map((item, index) => (
        <li key={index}>
          <Text tone="muted" variant="body">
            {item}
          </Text>
        </li>
      ))}
    </ol>
  );
}

function Code({ children }: { children: ReactNode }) {
  return <code className="bg-slate-100 px-1 font-mono text-[0.9em]">{children}</code>;
}

export function XgMethodPage() {
  return (
    <Stack gap="lg">
      <Stack gap="xs">
        <Text variant="subheading">How the expected goals model works</Text>
        <Text tone="muted">
          A short technical description of the xG model — the data, the statistics, and how the
          model runs in the app.
        </Text>
      </Stack>

      <Section title="What expected goals measures">
        <P>
          Expected goals (xG) is the probability that a shot becomes a goal. The value is between 0
          and 1. A shot from the slot might score 0.20. A shot from the point might score 0.02.
        </P>
        <P>
          To get a team&apos;s xG for a game, add the xG of every shot the team took. A team with
          3.1 xG created chances worth about 3 goals.
        </P>
      </Section>

      <Section title="The data">
        <P>
          The model learns from shots that already happened. The training set has about 373,000
          shots across 3 NHL seasons (2023-24 to 2025-26). About 27,000 of them were goals.
        </P>
        <P>
          Each shot comes from the ingested play-by-play data. The model uses three event types:
          goal, shot on goal, and missed shot. It does not use blocked shots. A blocked shot&apos;s
          recorded position is the blocker, not the shooter.
        </P>
      </Section>

      <Section title="What the model looks at">
        <P>Each shot becomes a row of features:</P>
        <Bullets
          items={[
            <>
              <strong>Distance</strong> — feet from the shot to the attacking net.
            </>,
            <>
              <strong>Angle</strong> — the angle between the shot and the middle of the net. A shot
              straight on has angle 0.
            </>,
            <>
              <strong>Shot type</strong> — wrist, slap, snap, backhand, tip-in, and others.
            </>,
            <>
              <strong>Strength state</strong> — even strength, power play, or short-handed.
            </>,
            <>
              <strong>Danger zone</strong> — high, mid, or long range, from the &ldquo;home
              plate&rdquo; area on the rink.
            </>,
            <>
              <strong>Rebound</strong> — true when the same team took another shot 3 seconds or less
              before this one.
            </>,
          ]}
        />
        <P>
          Distance, angle, and danger zone fold onto one end of the rink first. The same physical
          shot gets the same features on both ends.
        </P>
      </Section>

      <Section title="The model: logistic regression">
        <P>
          The model is a logistic regression. It gives each feature a weight, called a coefficient.
          To score a shot:
        </P>
        <Steps
          items={[
            "Multiply each feature by its coefficient.",
            <>
              Add the results together, plus a start value called the intercept. Call the total{" "}
              <Code>z</Code>.
            </>,
            <>
              Convert <Code>z</Code> to a probability with the logistic function:{" "}
              <Code>p = 1 / (1 + e^(-z))</Code>.
            </>,
          ]}
        />
        <P>
          The logistic function keeps the output between 0 and 1. A large <Code>z</Code> gives a
          probability near 1. A large negative <Code>z</Code> gives a probability near 0.
        </P>
        <P>The sign of a coefficient shows direction:</P>
        <Bullets
          items={[
            "Distance has a negative coefficient. A longer shot has a lower probability.",
            "A wide angle has a negative coefficient. A sharp-angle shot has a lower probability.",
          ]}
        />
        <P>
          Text categories such as shot type become one column per value. One value in each category
          is the reference. Its effect is part of the intercept.
        </P>
        <P>
          The model is linear, so the app stores it as a short list of coefficients and applies it
          with simple arithmetic. A tree model would score better but needs a different serving
          design. That is a future option, not the current model.
        </P>
      </Section>

      <Section title="How training works">
        <P>
          Training runs once, by hand, when new data needs a new fit. It is not automatic. The
          training data does not change between fits.
        </P>
        <Steps
          items={[
            "A Rails rake task reads the shots from the database and writes a CSV file. The same data always produces the same file.",
            <>
              A Python script (<Code>ml/fit.py</Code>) reads the CSV. It uses pandas and
              scikit-learn.
            </>,
            "The script fits the logistic regression and writes the coefficients to a JSON file.",
            "A second rake task loads the JSON into the app. The model then appears in this admin section.",
          ]}
        />
        <P>
          Python never connects to the database. Rails never runs the fit. Each side does one job.
        </P>
      </Section>

      <Section title="How we check the model">
        <P>
          A model that fits its own training data well can still fail on new data. Four checks guard
          against that.
        </P>
        <Bullets
          items={[
            <>
              <strong>Held-out seasons.</strong> The script trains on 2 seasons and predicts the
              third. It repeats this for each season. Shots in one season share goalies and rules,
              so a random split of shots would leak information and overstate the fit.
            </>,
            <>
              <strong>Brier score and log loss.</strong> Both measure how close the predicted
              probabilities are to the real outcomes. Lower is better. The v1 model scores 0.0629
              Brier against 0.0637 for a distance-and-angle baseline.
            </>,
            <>
              <strong>Calibration.</strong> Group the shots by predicted probability. In each group,
              the average prediction should match the real goal rate. A shot the model rates at 10
              percent should score about 10 percent of the time.
            </>,
            <>
              <strong>Realistic totals.</strong> Sum the xG per team per game on held-out games. The
              average is about 3 per team, or about 6 goals per game combined — the real NHL rate.
            </>,
          ]}
        />
      </Section>

      <Section title="How the model runs in the app">
        <P>
          The coefficients live as JSON on an <Code>XgModel</Code> database row. One row is active
          at a time.
        </P>
        <P>
          For each shot, <Code>XgFormula</Code> builds the feature vector from the event and applies
          the active model&apos;s coefficients. When the active model does not carry a coefficient,
          that feature adds nothing. An old model with only distance and angle still works in the
          same code.
        </P>
        <P>To activate a new model:</P>
        <Steps
          items={[
            <>
              A rake task inserts the fitted coefficients as a new <Code>XgModel</Code> row.
            </>,
            <>
              <Code>activate!</Code> makes it the only active model in one atomic step.
            </>,
            "A backfill sync run recomputes every historical game's advanced stats against the new model.",
          ]}
        />
      </Section>
    </Stack>
  );
}
