import path from 'path';
import fs from 'fs-extra';
import fetch from 'node-fetch';

const base = path.join('.', 'docs', 'characters');

async function asset(url, file) {
    const response = await fetch(url);
    const stream = fs.createWriteStream(file);
    await new Promise((resolve, reject) => {
        stream.on('error', reject);
        response.body.on('end', resolve);
        response.body.pipe(stream);
    });
}

async function character(id) {
    const response = await fetch('http://www.granadoespada.com/ajax/', {
        method: 'POST',
        body: 'f=Get&c=Character&n=' + id,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        }
    });
    let data = await response.json();
    if(data && data.result) {
        data = data.aRow;
        await fs.writeJSON(path.join(base, data.CHARACTER_ID + '.json'), data, { spaces: 2 });
        const images = [];
        const screenshots = [];
        for(let key in data) {
            if(/^\/\w+/i.test(data[key])) {
                const file = data[key].split('/').pop();
                const request = 'http://www.granadoespada.com' + data[key];
                await asset(request, path.join(base, 'assets', file));
                data[key] = file;
            }
        }
        for(let i = 0; i < 10; i++) {
            if(/^[a-f0-9]+/i.test(data['IMAGE' + i])) {
                images.push({
                    thumbnail: data['ICON' + i],
                    src: data['IMAGE' + i]
                });
            }
            if(/^[a-f0-9]+/i.test(data['SCREENSHOT' + i])) {
                screenshots.push(data['SCREENSHOT' + i]);
            }
        }
        return {
            id: data.CHARACTER_NO,
            slug: data.CHARACTER_ID,
            name: data.NAME_ENG,
            description: data.DESC,
            status: {
                str: data.STR,
                agi: data.AGI,
                hp: data.HP,
                dex: data.DEX,
                int: data.INT,
                sen: data.SEN
            },
            icon: data.THUMBNAIL,
            portrait: data.BIGIMAGE,
            background: data.BG,
            images: images,
            screenshots: screenshots,
            //video: `https://www.youtube.com/results?search_query=granado+espada+${encodeURIComponent(data.NAME_ENG)}+skill+motion`
            video: 'https://www.youtube.com/c/fatsnake/search?query=' + encodeURIComponent('NPC ' + data.NAME_ENG)
        };
    } else {
        return undefined;
    }
}

export async function update() {
    const characters = [];
    await fs.rmdir(base, { recursive: true });
    await fs.ensureDir(path.join(base, 'assets'));
    for(let id = 1; id < 250; id++) {
        console.log('>>> Check Character:', id);
        const data = await character(id);
        if(data) {
            characters.push(data);
            console.log('    Success:', data.name);
        } else {
            console.warn('    Failed:', id);
        }
    }
    await fs.writeJSON(path.join(base, '0.json'), characters, { spaces: 2 });``
    // TODO: generate HTML page(s) ...
}