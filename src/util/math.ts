export const map = (value: number, start1: number, stop1: number, start2: number, stop2: number) => {
    return ((value - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
}

export const random = (min: number = 0, max: number = 1) => {
    return Math.random() * (max - min) + min;
}

export const skewedRandom = (min: number = 0, max: number = 1, skew: number = 1) => {
    return Math.pow(Math.random(), skew) * (max - min) + min;
}

// split into 3 colors and interpolate between them
export const lerpColor = (color1: number, color2: number, t: number) => {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;

    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;

    const r = Math.floor(lerp(r1, r2, t));
    const g = Math.floor(lerp(g1, g2, t));
    const b = Math.floor(lerp(b1, b2, t));

    return (r << 16) | (g << 8) | b;
}

export const constrain = (value: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, value));
}

export const lerp = (start: number, stop: number, amt: number) => {
    return start + (stop - start) * amt;
}