"use client";

import {StoryTutorialOverlay} from "./StoryTutorialOverlay";

const PAGES = [
  {image: "/images/tutorial/tutorial_0.png", textKey: "homePlayTutorial0"},
  {image: "/images/tutorial/tutorial_1.png", textKey: "homePlayTutorial1"},
] as const;

type HomePlayTutorialProps = {
  onComplete: () => void;
};

export function HomePlayTutorial({onComplete}: HomePlayTutorialProps) {
  return (
    <StoryTutorialOverlay
      ariaLabelKey="homePlayTutorial0"
      pages={PAGES}
      onComplete={onComplete}
    />
  );
}
