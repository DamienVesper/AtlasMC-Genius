const discord = (str: string): string => {
    return str
        .replace(`***`, `\\***`)
        .replace(`**`, `\\**`)
        .replace(`*`, `\\*`)
        .replace(`__`, `\\__`)
        .replace(`_`, `\\_`)
        .replace(`*`, `\\*`)
        .replace(`~~`, `\\~~`);
};

export {
    discord
};
