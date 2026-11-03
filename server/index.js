import 'dotenv/config';
import cors from 'cors';
import express from 'express';

const app = express();
const port = Number(process.env.PORT || 3001);
const metaGraphVersion = process.env.META_GRAPH_API_VERSION || 'v23.0';

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, service: 'baha-ad-builder-api' });
});

app.get('/api/meta/status', (_request, response) => {
  const adAccountId = process.env.META_AD_ACCOUNT_ID;
  const pageId = process.env.META_PAGE_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  const missing = [];

  if (!/^act_\d+$/.test(adAccountId || '')) missing.push('META_AD_ACCOUNT_ID');
  if (!/^\d+$/.test(pageId || '')) missing.push('META_PAGE_ID');
  if (!accessToken || accessToken.includes('điền_')) missing.push('META_ACCESS_TOKEN');

  if (missing.length > 0) {
    return response.status(503).json({
      ok: false,
      ready: false,
      missing,
      message: `Chưa đủ cấu hình Meta: ${missing.join(', ')}.`
    });
  }

  return verifyMetaAssets(adAccountId, pageId, accessToken, response);
});

async function verifyMetaAssets(adAccountId, pageId, accessToken, response) {
  const assets = [
    ['Ad Account', adAccountId, 'id,name,account_status'],
    ['Facebook Page', pageId, 'id,name']
  ];

  try {
    const results = await Promise.all(assets.map(async ([label, id, fields]) => {
      const url = new URL(`https://graph.facebook.com/${metaGraphVersion}/${id}`);
      url.searchParams.set('fields', fields);
      url.searchParams.set('access_token', accessToken);
      const assetResponse = await fetch(url);
      const result = await assetResponse.json();
      return { label, ok: assetResponse.ok && !result.error, status: assetResponse.status, result };
    }));
    const failed = results.find((asset) => !asset.ok);
    if (failed) {
      return response.status(502).json({
        ok: false,
        ready: false,
        message: `${failed.label} không thể truy cập: ${failed.result.error?.message || `Meta trả về HTTP ${failed.status}.`}`
      });
    }
    return response.json({
      ok: true,
      ready: true,
      adAccountId,
      pageId,
      adAccountName: results[0].result.name,
      pageName: results[1].result.name
    });
  } catch {
    return response.status(502).json({ ok: false, ready: false, message: 'Không thể kết nối Meta để xác minh tài khoản và Page.' });
  }
}

app.get('/api/telegram/status', async (_request, response) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId || token.includes('điền_') || chatId.includes('điền_')) {
    return response.status(503).json({ ok: false, message: 'Chưa cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID.' });
  }

  try {
    const botResponse = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const botResult = await botResponse.json();
    if (!botResponse.ok || !botResult.ok) {
      return response.status(502).json({ ok: false, message: 'TELEGRAM_BOT_TOKEN không hợp lệ.' });
    }

    const chatResponse = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(chatId)}`);
    const chatResult = await chatResponse.json();
    if (!chatResponse.ok || !chatResult.ok) {
      return response.status(502).json({
        ok: false,
        message: chatResult.description || 'Không tìm thấy chat. Hãy kiểm tra Chat ID và thêm bot vào nhóm.'
      });
    }
    return response.json({ ok: true, botUsername: botResult.result.username, chatType: chatResult.result.type });
  } catch {
    return response.status(502).json({ ok: false, message: 'Không thể kết nối Telegram để kiểm tra cấu hình.' });
  }
});

app.post('/api/telegram', async (request, response) => {
  const { campaign } = request.body || {};
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId || token.includes('điền_') || chatId.includes('điền_')) {
    return response.status(503).json({
      message: 'Chưa cấu hình Telegram. Hãy điền TELEGRAM_BOT_TOKEN và TELEGRAM_CHAT_ID trong file .env.'
    });
  }
  if (!campaign?.name || !campaign?.objective || !campaign?.budget || !campaign?.duration) {
    return response.status(400).json({ message: 'Thông tin chiến dịch chưa đầy đủ để gửi thông báo.' });
  }

  const message = [
    '🔔 BAHA Group - Chiến dịch mới',
    `Nền tảng: ${campaign.platform || 'Google Ads'}`,
    `Tên: ${campaign.name}`,
    `Mục tiêu: ${campaign.objective}`,
    `Khu vực: ${campaign.location}`,
    `Ngân sách: ${Number(campaign.budget).toLocaleString('vi-VN')} VNĐ/ngày`,
    `Thời gian: ${campaign.duration} ngày`,
    `Tổng dự kiến: ${(Number(campaign.budget) * Number(campaign.duration)).toLocaleString('vi-VN')} VNĐ`,
    `Trạng thái: ${campaign.status || 'Bản nháp'}`,
    '',
    'Lưu ý: Bản nháp Facebook Ads chỉ được lưu trong ứng dụng, chưa gửi lên Meta và chưa chạy quảng cáo trả phí.'
  ].join('\n');

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message })
    });
    const result = await telegramResponse.json();
    if (!telegramResponse.ok || !result.ok) {
      return response.status(502).json({
        message: result.description || 'Telegram không nhận được thông báo. Vui lòng thử lại.'
      });
    }
    return response.json({ ok: true });
  } catch {
    return response.status(502).json({ message: 'Không thể kết nối Telegram lúc này. Chiến dịch vẫn đã được lưu.' });
  }
});

app.listen(port, () => {
  console.log(`BAHA API đang chạy tại http://localhost:${port}`);
});
