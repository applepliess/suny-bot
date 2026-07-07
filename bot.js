// ========== ПОКАЗ ПРИВИЛЕГИЙ ==========
function showPrivileges(chatId) {
    let text = `👑 <b>Привилегии</b>\n\n`;
    text += `🔥 <b>СКИДКА 50% НА:</b> D.ADMIN, PASXA, MONSTER\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    for (const [key, priv] of Object.entries(PRIVILEGES)) {
        if (priv.hasDiscount) {
            text += `${priv.emoji} <b>${priv.name}</b>\n`;
            text += `   💰 ${priv.price} ⭐ (было ${priv.oldPrice} ⭐) ${priv.discount}\n\n`;
        } else {
            text += `${priv.emoji} <b>${priv.name}</b> — ${priv.price} ⭐\n\n`;
        }
    }
    
    // ⬇️ УБРАЛ ЭТУ СТРОКУ: text += `⬇️ <b>Выбери привилегию для подробностей:</b>`;
    
    const buttons = Object.entries(PRIVILEGES).map(([key, priv]) => [
        { text: `${priv.emoji} ${priv.name} (${priv.price}⭐)`, callback_data: `show_priv_${key}` }
    ]);
    buttons.push([{ text: '⬅️ Назад в меню', callback_data: 'menu' }]);
    
    bot.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: buttons
        }
    });
}
