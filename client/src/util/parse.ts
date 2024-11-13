export const readableTime = (time: number, ago: boolean = false, seconds: boolean = true): string => {
    const MS_PER_SECOND = 1000;
    const MS_PER_MINUTE = 60 * MS_PER_SECOND;
    const MS_PER_HOUR = 60 * MS_PER_MINUTE;
    const MS_PER_DAY = 24 * MS_PER_HOUR;
    const MS_PER_WEEK = 7 * MS_PER_DAY;

    const units = [
        { unit: 'weeks', ms: MS_PER_WEEK },
        { unit: 'days', ms: MS_PER_DAY },
        { unit: 'hours', ms: MS_PER_HOUR },
        { unit: 'minutes', ms: MS_PER_MINUTE },
    ];

    if (seconds) {
        units.push({ unit: 'seconds', ms: MS_PER_SECOND });
    }

    const descriptors: string[] = [];

    for (const { unit, ms } of units) {
        const quantity = Math.floor(time / ms);
        if (quantity > 0) {
            const unitStr = quantity === 1 ? unit.slice(0, -1) : unit;
            descriptors.push(`${quantity} ${unitStr}`);
            time -= quantity * ms;
        }
        if (descriptors.length === 2) break;
    }

    if (descriptors.length === 0) {
        descriptors.push(seconds ? 'under a second' : 'under a minute');
    }

    const output = descriptors.join(', ');
    return ago ? `${output} ago` : output;
}

export const readableMemory = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let unitIndex = 0;
    while (bytes >= 1024 && unitIndex < units.length - 1) {
        bytes /= 1024;
        unitIndex++;
    }
    return `${bytes.toFixed(2)} ${units[unitIndex]}`;
}