import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Bell, Check, CheckCircle2, CircleHelp, Eye,
  FileText, ImagePlus, MapPin, Megaphone, MessageCircle, ShieldCheck,
  Sparkles, Target, Users, Wallet
} from 'lucide-react';

const STORAGE_KEY = 'baha-campaigns';
const DRAFT_KEY = 'baha-campaign-draft';
const steps = [
  ['Thông tin dịch vụ', FileText], ['Mục tiêu', Target], ['Khách hàng', Users],
  ['Ngân sách', Wallet], ['Nội dung', Sparkles], ['Xem trước', Eye],
  ['Kiểm tra', ShieldCheck], ['Quản lý', Bell]
];
const initialCampaign = {
  name: 'Chăm sóc sắc đẹp', description: 'Gói chăm sóc da và thư giãn nhẹ nhàng dành cho phụ nữ bận rộn.',
  objective: 'Tăng số người ghé thăm trang', location: 'TP.HCM',
  audience: 'Phụ nữ quan tâm chăm sóc sắc đẹp', ageRange: '25 - 55 tuổi',
  budget: 200000, duration: 7, title: 'Đẹp hơn mỗi ngày cùng dịch vụ chăm sóc tận tâm',
  content: 'Đặt lịch tư vấn miễn phí hôm nay để được chuyên viên gợi ý liệu trình phù hợp.',
  destinationUrl: 'https://bahagroup.vercel.app/',
  cta: 'Nhắn tin tư vấn'
};

function readCampaigns() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function readDraft() {
  try { return { ...initialCampaign, ...JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}') }; } catch { return initialCampaign; }
}
function money(value) { return `${Number(value || 0).toLocaleString('vi-VN')} VNĐ`; }
function campaignId() {
  return globalThis.crypto?.randomUUID?.() || `campaign-${Date.now()}`;
}
async function readApiResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(response.status === 404 || response.status === 502
      ? 'Không kết nối được backend. Hãy chạy lại npm run dev.'
      : `Backend trả về phản hồi không hợp lệ (HTTP ${response.status}).`);
  }
  return response.json();
}

export default function App() {
  const [step, setStep] = useState(1);
  const [campaign, setCampaign] = useState(readDraft);
  const [campaigns, setCampaigns] = useState(readCampaigns);
  const [notice, setNotice] = useState(null);
  const [sending, setSending] = useState(false);
  const [savedCampaign, setSavedCampaign] = useState(null);
  const [checkingTelegram, setCheckingTelegram] = useState(false);
  const [checkingMeta, setCheckingMeta] = useState(false);
  const [creatingMetaDraft, setCreatingMetaDraft] = useState(false);

  const total = useMemo(() => Number(campaign.budget || 0) * Number(campaign.duration || 0), [campaign]);
  const update = (key, value) => setCampaign((current) => ({ ...current, [key]: value }));
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(campaign));
  }, [campaign]);
  const validate = (allSteps = false) => {
    if (step === 1 && (!campaign.name.trim() || !campaign.description.trim())) return 'Vui lòng nhập tên và mô tả dịch vụ.';
    if (step === 3 && !campaign.location.trim()) return 'Vui lòng nhập khu vực muốn tiếp cận.';
    if (step === 4 && (campaign.budget < 30000 || campaign.duration < 1)) return 'Ngân sách tối thiểu là 30.000 VNĐ/ngày và thời gian ít nhất 1 ngày.';
    if (step === 5 && (!campaign.title.trim() || !campaign.content.trim())) return 'Vui lòng hoàn thiện tiêu đề và nội dung quảng cáo.';
    if (step === 5 && campaign.objective === 'Tăng số người ghé thăm trang' && !campaign.destinationUrl.trim()) return 'Vui lòng nhập đường dẫn website cần quảng bá.';
    if (allSteps && (!campaign.name.trim() || !campaign.description.trim() || !campaign.location.trim() ||
      campaign.budget < 30000 || campaign.duration < 1 || !campaign.title.trim() || !campaign.content.trim() ||
      (campaign.objective === 'Tăng số người ghé thăm trang' && !campaign.destinationUrl.trim()))) {
      return 'Vui lòng hoàn thiện các thông tin bắt buộc trước khi lưu chiến dịch.';
    }
    return null;
  };
  const next = () => {
    const error = validate();
    if (error) return setNotice({ type: 'error', text: error });
    setNotice(null); setStep((value) => Math.min(8, value + 1));
  };
  const previous = () => { setNotice(null); setStep((value) => Math.max(1, value - 1)); };
  const saveCampaign = async () => {
    const error = validate(true);
    if (error) return setNotice({ type: 'error', text: error });
    const saved = savedCampaign || { ...campaign, platform: 'Facebook Ads', mode: 'Bản nháp nội bộ', id: campaignId(), createdAt: new Date().toISOString(), status: 'Bản nháp' };
    if (!savedCampaign) {
      const nextCampaigns = [saved, ...campaigns];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCampaigns));
      setCampaigns(nextCampaigns);
      setSavedCampaign(saved);
    }
    setSending(true); setNotice({ type: 'success', text: 'Đã lưu bản nháp. Đang gửi thông báo Telegram thật...' });
    try {
      const response = await fetch('/api/telegram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaign: saved }) });
      const result = await readApiResponse(response);
      if (!response.ok) throw new Error(result.message || 'Gửi Telegram thất bại.');
      localStorage.removeItem(DRAFT_KEY);
      setNotice({ type: 'success', text: 'Đã lưu bản nháp và gửi thông báo Telegram thành công.' });
    } catch (error) {
      setNotice({ type: 'warning', text: `Chiến dịch đã được lưu, nhưng ${error.message}` });
    } finally { setSending(false); }
  };
  const checkTelegram = async () => {
    setCheckingTelegram(true);
    try {
      const response = await fetch('/api/telegram/status');
      const result = await readApiResponse(response);
      if (!response.ok) throw new Error(result.message || 'Không thể kiểm tra Telegram.');
      setNotice({ type: 'success', text: `Telegram đã sẵn sàng (${result.botUsername}).` });
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setCheckingTelegram(false);
    }
  };
  const checkMeta = async () => {
    setCheckingMeta(true);
    try {
      const response = await fetch('/api/meta/status');
      const result = await readApiResponse(response);
      if (!response.ok) throw new Error(result.message || 'Meta chưa đủ cấu hình.');
      setNotice({ type: 'success', text: `Meta đã sẵn sàng cho bản nháp (${result.adAccountId}).` });
    } catch (error) {
      setNotice({ type: 'warning', text: error.message });
    } finally {
      setCheckingMeta(false);
    }
  };
  const createMetaDraft = async () => {
    const error = validate(true);
    if (error) return setNotice({ type: 'error', text: error });
    const localDraft = savedCampaign || { ...campaign, platform: 'Facebook Ads', mode: 'Bản nháp nội bộ', id: campaignId(), createdAt: new Date().toISOString(), status: 'Bản nháp' };
    setCreatingMetaDraft(true);
    try {
      const response = await fetch('/api/meta/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign: localDraft })
      });
      const result = await readApiResponse(response);
      if (!response.ok) throw new Error(result.message || 'Không thể tạo bản nháp trên Meta.');
      const updated = { ...localDraft, status: 'Bản nháp trên Meta', metaCampaignId: result.metaCampaignId, metaAdSetId: result.metaAdSetId, metaCreativeId: result.metaCreativeId, metaAdId: result.metaAdId };
      const nextCampaigns = campaigns.map((item) => item.id === localDraft.id ? updated : item);
      if (!savedCampaign) {
        nextCampaigns.unshift(updated);
        setSavedCampaign(updated);
      } else {
        setSavedCampaign(updated);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCampaigns));
      setCampaigns(nextCampaigns);
      setNotice({ type: 'success', text: `Đã tạo đầy đủ bản nháp Meta (Campaign: ${result.metaCampaignId}). Tất cả thành phần đang PAUSED.` });
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setCreatingMetaDraft(false);
    }
  };

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><Megaphone size={22} /></div><div><strong>BAHA Group</strong><span>Thiết lập quảng cáo dễ dàng</span></div></div>
      <div className="safe-pill"><ShieldCheck size={17} /> Facebook Ads · Bản nháp</div>
    </header>
    <section className="hero"><div><p className="eyebrow">BẮT ĐẦU TRONG VÀI PHÚT</p><h1>Tạo chiến dịch quảng cáo<br /><em>thật đơn giản</em></h1><p className="hero-copy">Chúng tôi sẽ đồng hành cùng bạn qua 8 bước. Bạn sẽ duyệt bản nháp trước khi bất kỳ quảng cáo nào được gửi lên Meta.</p></div><div className="hero-badge"><Sparkles size={24} /><span>Facebook Ads<br /><b>Bản nháp an toàn</b></span></div></section>
    <section className="wizard-card">
      <nav className="stepper" aria-label="Các bước thiết lập chiến dịch">{steps.map(([label, Icon], index) => <button type="button" key={label} className={step === index + 1 ? 'step active' : step > index + 1 ? 'step completed' : 'step'} aria-label={`Bước ${index + 1}: ${label}`} aria-current={step === index + 1 ? 'step' : undefined} onClick={() => index + 1 < step && setStep(index + 1)}><span className="step-icon">{step > index + 1 ? <Check size={16} /> : <Icon size={16} />}</span><span className="step-label">{index + 1}. {label}</span></button>)}</nav>
      {notice && <div className={`notice ${notice.type}`} role="status" aria-live="polite"><CircleHelp size={18} />{notice.text}</div>}
      <div className="content">{renderStep(step, campaign, update, total, campaigns, checkTelegram, checkingTelegram, checkMeta, checkingMeta, createMetaDraft, creatingMetaDraft)}</div>
      <footer className="wizard-footer"><button className="button secondary" onClick={previous} disabled={step === 1}><ArrowLeft size={18} /> Quay lại</button><span className="step-count">Bước {step} / 8</span>{step < 7 && <button className="button primary" onClick={next}>Tiếp tục <ArrowRight size={18} /></button>}{step === 7 && <button className="button primary" onClick={() => { const error = validate(true); if (error) setNotice({ type: 'error', text: error }); else setStep(8); }}>Xác nhận để lưu <Check size={18} /></button>}{step === 8 && <button className="button primary" onClick={saveCampaign} disabled={sending}><Bell size={18} /> {sending ? 'Đang gửi...' : savedCampaign ? 'Gửi lại Telegram' : 'Lưu bản nháp'}</button>}</footer>
    </section>
    <p className="footer-note"><ShieldCheck size={15} /> An toàn tài chính: Chưa có quảng cáo nào được chạy và chưa phát sinh chi phí.</p>
  </main>;
}

function Field({ label, hint, children }) { return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
function renderStep(step, c, update, total, campaigns, checkTelegram, checkingTelegram, checkMeta, checkingMeta, createMetaDraft, creatingMetaDraft) {
  if (step === 1) return <><StepHeading icon={FileText} title="Thông tin dịch vụ" subtitle="Hãy cho chúng tôi biết bạn muốn giới thiệu sản phẩm hoặc dịch vụ nào." /><div className="form-grid"><Field label="Tên sản phẩm / dịch vụ *"><input value={c.name} onChange={(e) => update('name', e.target.value)} placeholder="Ví dụ: Chăm sóc sắc đẹp" /></Field><Field label="Mô tả ngắn *" hint="Mô tả rõ ràng giúp khách hàng hiểu bạn cung cấp gì."><textarea value={c.description} onChange={(e) => update('description', e.target.value)} rows="4" placeholder="Viết một vài câu đơn giản..." /></Field></div><div className="upload-box"><ImagePlus size={24} /><div><b>Thêm hình ảnh hoặc video (không bắt buộc)</b><small>Trong bản mô phỏng, bạn có thể bổ sung sau.</small></div><button type="button" className="button secondary" disabled title="Tính năng sẽ được bổ sung sau">Sẽ bổ sung sau</button></div></>;
  if (step === 2) return <><StepHeading icon={Target} title="Bạn muốn đạt được điều gì?" subtitle="Chọn kết quả quan trọng nhất với cửa hàng của bạn." /><div className="choice-grid">{['Có thêm khách hàng liên hệ tư vấn', 'Tăng số người ghé thăm trang', 'Tăng số đơn hàng'].map((value, i) => <button className={c.objective === value ? 'choice selected' : 'choice'} key={value} onClick={() => update('objective', value)}><span className="choice-number">0{i + 1}</span><strong>{value}</strong><small>{['Khách hàng nhắn tin hoặc gọi cho bạn.', 'Nhiều người biết đến dịch vụ hơn.', 'Khuyến khích khách hàng mua hàng.'][i]}</small>{c.objective === value && <CheckCircle2 className="choice-check" size={20} />}</button>)}</div></>;
  if (step === 3) return <><StepHeading icon={Users} title="Bạn muốn tiếp cận ai?" subtitle="Chọn khu vực và mô tả nhóm khách hàng phù hợp nhất." /><div className="form-grid two"><Field label="Khu vực *"><div className="input-icon"><MapPin size={18} /><input value={c.location} onChange={(e) => update('location', e.target.value)} /></div></Field><Field label="Độ tuổi tham khảo"><select value={c.ageRange} onChange={(e) => update('ageRange', e.target.value)}><option>18 - 30 tuổi</option><option>25 - 55 tuổi</option><option>35 - 65 tuổi</option><option>Mọi độ tuổi</option></select></Field></div><Field label="Nhóm khách hàng bạn muốn tìm"><input value={c.audience} onChange={(e) => update('audience', e.target.value)} /></Field><div className="tip"><Sparkles size={18} /><span><b>Gợi ý của BAHA:</b> Với dịch vụ làm đẹp tại TP.HCM, nhóm phụ nữ 25 - 55 tuổi thường là lựa chọn phù hợp để bắt đầu.</span></div></>;
  if (step === 4) return <><StepHeading icon={Wallet} title="Ngân sách và thời gian" subtitle="Bạn luôn kiểm soát được số tiền dự kiến. Không có khoản tiền nào bị trừ tự động." /><div className="budget-box"><Field label="Ngân sách mỗi ngày *" hint="Meta yêu cầu ngân sách tối thiểu khoảng 26.000 VNĐ/ngày; BAHA dùng mức an toàn 30.000 VNĐ."><div className="money-input"><input type="number" min="30000" value={c.budget} onChange={(e) => update('budget', Number(e.target.value))} /><b>VNĐ / ngày</b></div></Field><Field label="Số ngày dự kiến *"><div className="money-input"><input type="number" min="1" value={c.duration} onChange={(e) => update('duration', Number(e.target.value))} /><b>ngày</b></div></Field></div><div className="total-box"><span>Tổng ngân sách dự kiến</span><strong>{money(total)}</strong><small>Đây chỉ là phép tính tham khảo trong bản nháp.</small></div></>;
  if (step === 5) return <><StepHeading icon={Sparkles} title="Hoàn thiện nội dung" subtitle="Chúng tôi đã gợi ý nội dung. Bạn có thể sửa lại cho đúng với cách nói của mình." /><Field label="Tiêu đề quảng cáo *"><input value={c.title} onChange={(e) => update('title', e.target.value)} /></Field><Field label="Nội dung quảng cáo *"><textarea value={c.content} onChange={(e) => update('content', e.target.value)} rows="5" /></Field><Field label="Nút kêu gọi hành động"><select value={c.cta} onChange={(e) => update('cta', e.target.value)}><option>Nhắn tin tư vấn</option><option>Đặt lịch ngay</option><option>Tìm hiểu thêm</option></select></Field>{c.objective === 'Tăng số người ghé thăm trang' && <Field label="Website đích *" hint="Đường dẫn này sẽ được lưu trong bản nháp để bạn duyệt trước."><input type="url" value={c.destinationUrl} onChange={(e) => update('destinationUrl', e.target.value)} placeholder="https://example.com" /></Field>}</>;
  if (step === 6) return <><StepHeading icon={Eye} title="Xem trước quảng cáo" subtitle="Đây là bản nháp Facebook Ads. Chưa có quảng cáo nào được gửi lên Meta hoặc bật chạy." /><div className="preview-wrap"><div className="preview-card"><div className="preview-head"><div className="avatar">F</div><div><b>{c.name || 'Tên cửa hàng'}</b><small>Quảng cáo Facebook · Bản nháp</small></div><span>•••</span></div><div className="preview-image"><Sparkles size={38} /><b>Hình ảnh dịch vụ của bạn</b><small>Hình ảnh thật có thể thêm sau</small></div><div className="preview-text"><h3>{c.title}</h3><p>{c.content}</p></div><div className="preview-cta"><span>{c.destinationUrl || c.location}</span><button>{c.cta}</button></div></div><div className="preview-side"><div className="tag"><ShieldCheck size={18} /> Facebook Ads · Bản nháp</div><p>Phiên bản này chỉ lưu cấu hình trong ứng dụng để bạn duyệt. Chưa kết nối Meta API, chưa kích hoạt quảng cáo và không phát sinh chi phí.</p></div></div></>;
  if (step === 7) return <><StepHeading icon={ShieldCheck} title="Kiểm tra trước khi lưu" subtitle="Hãy xem lại lần cuối. Bản nháp sẽ được lưu trong ứng dụng để bạn duyệt." /><div className="status-track"><StatusBadge label="Bản nháp" active /><span>→</span><StatusBadge label="Chờ bạn duyệt" active /><span>→</span><StatusBadge label="Chưa gửi Meta" /></div><div className="review-grid">{[['Dịch vụ', c.name], ['Mục tiêu', c.objective], ['Khu vực', `${c.location} · ${c.ageRange}`], ['Ngân sách', `${money(c.budget)} × ${c.duration} ngày`], ['Website đích', c.destinationUrl || 'Chưa nhập'], ['Tổng dự kiến', money(total)], ['Nút hành động', c.cta]].map(([label, value]) => <div className="review-item" key={label}><small>{label}</small><b>{value}</b></div>)}</div><div className="safety-alert"><ShieldCheck size={22} /><div><b>Cam kết an toàn</b><p>BAHA chỉ lưu bản nháp trong ứng dụng. Chưa gọi Meta API, chưa kích hoạt quảng cáo và không phát sinh chi phí.</p></div></div></>;
  return <><StepHeading icon={Bell} title="Quản lý bản nháp" subtitle="Bản nháp đã lưu sẽ nằm ở đây. Bạn có thể kiểm tra và tạo đầy đủ bộ quảng cáo PAUSED trên Meta." /><div className="telegram-box"><MessageCircle size={25} /><div><b>Telegram · Gửi thật</b><p>Thông báo chỉ được gửi sau khi bạn bấm nút lưu. Token được bảo vệ ở máy chủ.</p></div><button type="button" className="button secondary" onClick={checkTelegram} disabled={checkingTelegram}>{checkingTelegram ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</button></div><div className="telegram-box"><ShieldCheck size={25} /><div><b>Meta · Tạo bộ bản nháp PAUSED</b><p>Tạo Campaign, Ad Set, Creative và Ad ở trạng thái tạm dừng. Chưa phân phối và chưa phát sinh chi phí.</p></div><button type="button" className="button secondary" onClick={checkMeta} disabled={checkingMeta}>{checkingMeta ? 'Đang kiểm tra...' : 'Kiểm tra Meta'}</button><button type="button" className="button primary" onClick={createMetaDraft} disabled={creatingMetaDraft}>{creatingMetaDraft ? 'Đang tạo...' : 'Tạo bản nháp Meta'}</button></div><div className="status-guide"><b>Các trạng thái an toàn</b><div><StatusBadge label="Campaign PAUSED" /><StatusBadge label="Ad Set PAUSED" /><StatusBadge label="Ad PAUSED" /></div><small>Hệ thống dùng website, nội dung, ngân sách và Page đã cấu hình để tạo bộ bản nháp trên Meta.</small></div>{campaigns.length === 0 ? <div className="empty"><FileText size={30} /><p>Chưa có bản nháp nào được lưu.</p></div> : <div className="campaign-list">{campaigns.slice(0, 5).map((item) => <div className="campaign-row" key={item.id}><div><b>{item.name}</b><small>{item.location} · {money(item.budget)}/ngày · {item.duration} ngày</small></div><span className="status">{item.status}</span></div>)}</div>}</>;
}
function StepHeading({ icon: Icon, title, subtitle }) { return <div className="step-heading"><div className="heading-icon"><Icon size={24} /></div><div><h2>{title}</h2><p>{subtitle}</p></div></div>; }
function StatusBadge({ label, active = false }) { return <span className={`status-badge${active ? ' active' : ''}`}>{label}</span>; }
