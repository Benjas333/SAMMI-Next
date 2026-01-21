export function displayTime(time: number): string {
    if (time < 1_000)
        return `${time}ms`;

    time = time / 1_000;

    if (time < 60)
        return `${time.toFixed(2)}s`

    const mins = Math.floor(time / 60);
    const seconds = Math.round(time % 60);

    if (seconds === 60)
        return `${mins + 1}m`

    return `${mins}m${seconds < 1 ? '' : ` ${seconds}s`}`;
}
