interface TimerProps {
  time: number;
}

function Timer({ time }: TimerProps) {
  const minutes = Math.floor(time / 60000);
  const seconds = Math.floor((time % 60000) / 1000);

  return (
    <span className="font-mono font-bold">
      {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
    </span>
  );
}

export { Timer };
