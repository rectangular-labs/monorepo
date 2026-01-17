import { MoveRight, Search } from "@rectangular-labs/ui/components/icon";
import { buttonVariants } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { useState } from "react";
import { WaitListDialog } from "../waitlist-dialog";

export const Hero = () => {
  const [dnOk, setDnOk] = useState(true);
  const [chatgptOk, setChatgptOk] = useState(true);

  const GoogleMark = () => (
    <svg
      aria-hidden
      className="h-5 w-5"
      viewBox="0 0 256 262"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Google</title>
      <path
        d="M255.68 133.51c0-11.11-.99-19.2-3.14-27.61H130.49v50.85h71.54c-1.44 12.62-9.23 31.62-26.59 44.4l-.24 1.7 38.6 29.92 2.67.27c24.55-22.67 38.81-56.03 38.81-99.53"
        fill="#4285F4"
      />
      <path
        d="M130.49 261.1c35.09 0 64.57-11.62 86.09-31.62l-41.03-31.89c-10.97 7.62-25.7 12.92-45.06 12.92-34.37 0-63.55-22.67-74.05-54.03l-1.6.13-40.21 31.08-.55 1.53c21.38 42.7 65.24 71.88 116.41 71.88"
        fill="#34A853"
      />
      <path
        d="M56.44 156.48c-2.76-8.4-4.33-17.36-4.33-26.59 0-9.23 1.58-18.19 4.19-26.59l-.08-1.82-40.73-31.58-1.33.63C5.49 95.08 0 112.52 0 129.89c0 17.36 5.49 34.81 14.16 49.35l42.28-32.76"
        fill="#FBBC05"
      />
      <path
        d="M130.49 49.49c24.4 0 40.88 10.53 49.91 19.36l36.45-35.6C195.05 12.92 165.58 0 130.49 0 79.32 0 35.46 29.18 14.16 70.53l42.2 32.76c10.58-31.36 39.76-53.8 74.13-53.8"
        fill="#EA4335"
      />
    </svg>
  );

  const ChatGptMark = () => (
    <div className="h-5 w-5 text-foreground">
      {chatgptOk ? (
        <img
          alt="ChatGPT"
          className="h-5 w-5"
          onError={() => setChatgptOk(false)}
          src="/logos/chatgpt.png"
        />
      ) : (
        <svg
          aria-hidden
          className="h-5 w-5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>ChatGPT</title>
          <path
            d="M12 2.5a4.5 4.5 0 0 1 4.45 3.86 4.5 4.5 0 0 1 2.69 8.26A4.5 4.5 0 0 1 13.5 21.3a4.5 4.5 0 0 1-8.64-1.83 4.5 4.5 0 0 1-2-7.37A4.5 4.5 0 0 1 10.5 3.01c.47-.33.98-.51 1.5-.51Z"
            fill="currentColor"
          />
        </svg>
      )}
    </div>
  );

  return (
    <div className="relative flex min-h-screen w-full items-center bg-background lg:min-h-[calc(100vh-70px)]">
      <Section className="relative z-10 w-full py-20 lg:py-32">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-4xl space-y-8 text-center">
            <div className="space-y-4">
              <h1 className="font-regular text-4xl text-foreground leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Move from SEO employee to <br />
                <span className="font-semibold text-primary">
                  decision-maker.
                </span>
              </h1>
              <p className="mx-auto max-w-xl text-lg text-muted-foreground leading-relaxed sm:text-xl">
                Fluid Posts handles execution across audits, planning, writing,
                and reporting — leaving you to make the decisions that matter.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 sm:justify-center">
              <WaitListDialog
                trigger={
                  <button
                    className={buttonVariants({
                      className: "h-12 gap-3 px-8 text-lg",
                      size: "lg",
                    })}
                    type="button"
                  >
                    Join the waitlist <MoveRight className="h-5 w-5" />
                  </button>
                }
              />
              <p className="font-medium text-muted-foreground text-sm">
                Launching End-Jan 2026
              </p>
            </div>

            <div className="pt-2">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.4em]">
                Early results
              </p>
              <p className="mx-auto mt-2 max-w-3xl text-muted-foreground text-sm leading-relaxed">
                In early pilots, we helped 2 clients reach{" "}
                <span className="font-semibold text-foreground">
                  #1 on Google
                </span>{" "}
                and appear on{" "}
                <span className="font-semibold text-foreground">ChatGPT</span>{" "}
                for targeted terms within a month.
              </p>

              <div className="mx-auto mt-6 max-w-3xl">
                <div className="rounded-2xl border border-border bg-background/40 p-5 text-left">
                  <p className="mt-4 text-center font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
                    Pilot highlight
                  </p>

                  <div className="mx-auto mt-3 grid max-w-2xl gap-4 sm:grid-cols-2">
                    {/* Google SERP mock */}
                    <div className="rounded-xl border border-border bg-background/60 p-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <GoogleMark />
                        <span>Google</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <span>gambling chargebacks</span>
                      </div>
                      <div className="mt-3 rounded-lg border border-border bg-background p-3">
                        <p className="text-muted-foreground text-sm">
                          <span className="text-primary">#1</span> result
                        </p>
                        <p className="mt-1 font-semibold text-primary">
                          Gambling Chargebacks: How to Dispute Online Casino...
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
                          {dnOk ? (
                            <img
                              alt="Dispute Ninja"
                              className="h-5 w-5 shrink-0 rounded bg-background"
                              onError={() => setDnOk(false)}
                              src="/logos/dispute-ninjas.png"
                            />
                          ) : (
                            <div className="flex h-5 w-5 items-center justify-center rounded bg-foreground font-bold text-[9px] text-background">
                              DN
                            </div>
                          )}
                          <span className="font-semibold text-foreground">
                            Dispute Ninjas
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ChatGPT mock */}
                    <div className="rounded-xl border border-border bg-background/60 p-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <span className="text-foreground">
                          <ChatGptMark />
                        </span>
                        <span>ChatGPT</span>
                      </div>

                      <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        best chargeback softwares
                      </div>

                      <div className="mt-3 rounded-lg border border-border bg-background p-3">
                        <p className="text-muted-foreground text-sm">
                          <span className="text-primary">#5</span> Result
                        </p>
                        <p className="mt-1 font-semibold text-primary">
                          Top Chargeback Management &amp; Prevention Software
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
                          {dnOk ? (
                            <img
                              alt="Dispute Ninja"
                              className="h-5 w-5 shrink-0 rounded bg-background"
                              onError={() => setDnOk(false)}
                              src="/logos/dispute-ninjas.png"
                            />
                          ) : (
                            <div className="flex h-5 w-5 items-center justify-center rounded bg-foreground font-bold text-[9px] text-background">
                              DN
                            </div>
                          )}
                          <span className="font-semibold text-foreground">
                            Dispute Ninjas
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
};
