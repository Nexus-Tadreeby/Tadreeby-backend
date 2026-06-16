export function emailLayout(content: string) {
    return `
    <div style="font-family:Arial,sans-serif;line-height:1.6">
        <div style="max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:10px">
            ${content}
        </div>
    </div>
    `;
}

export function button(url: string, text: string, color = '#4F46E5') {
    return `
        <div style="margin-top:20px">
            <a href="${url}"
               style="
                background:${color};
                color:#fff;
                padding:12px 18px;
                text-decoration:none;
                border-radius:6px;
                display:inline-block;
                font-weight:600;
               ">
               ${text}
            </a>
        </div>
    `;
}