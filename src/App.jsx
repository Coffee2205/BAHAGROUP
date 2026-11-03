import { useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Bell, Check, CheckCircle2, CircleHelp, Eye,
  FileText, ImagePlus, MapPin, Megaphone, MessageCircle, Save, ShieldCheck,
  Sparkles, Target, Users, Wallet
} from 'lucide-react';

const STORAGE_KEY = 'baha-campaigns';
const steps = [
  ['Thông tin dịch vụ', FileText], ['Mục tiêu', Target], ['Khách hàng', Users],
  ['Ngân sách', Wallet], ['Nội dung', Sparkles], ['Xem trước', Eye],
  ['Kiểm tra', ShieldCheck], ['Quản lý', Bell]
];
const initialCampaign = {
  name: 'Chăm sóc sắc đẹp', description: 'Gói chăm sóc da và thư giãn nhẹ nhàng dành cho phụ nữ bận rộn.',
  objective: 'Có thêm khách hàng liên hệ tư vấn', location: 'TP.HCM',
  audience: 'Phụ nữ quan tâm chăm sóc sắc đẹp', ageRange: '25 - 55 tuổi',
  budget: 200000, duration: 7, title: 'Đẹp hơn mỗi ngày cùng dịch vụ chăm sóc tận tâm',
  content: 'Đặt lịch tư vấn miễn phí hôm nay để được chuyên viên gợi ý liệu trình phù hợp.',
  cta: 'Nhắn tin tư vấn'
};

function readCampaigns() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function money(value) { return `${Number(value || 0).toLocaleString('vi-VN')} VNĐ`; }

export default function App() {
  const [step, setStep] = useState(1);
  const [campaign, setCampaign] = useState(initialCampaign);
  const [campaigns, setCampaigns] = useState(readCampaigns);
  const [notice, setNotice] = useState(null);
  const [sending, setSending] = useState(false);

  const total = useMemo(() => Number(campaign.budget || 0) * Number(campaign.duration || 0), [campaign]);
  const update = (key, value) => setCampaign((current) => ({ ...current, [key]: value }));
  const validate = () => {
    if (step === 1 && (!campaign.name.trim() || !campaign.description.trim())) return 'Vui lòng nhập tên và mô tả dịch vụ.';
    if (step === 3 && !campaign.location.trim()) return 'Vui lòng nhập khu vực muốn tiếp cận.';
    if (step === 4 && (campaign.budget < 10000 || campaign.duration < 1)) return 'Ngân sách tối thiểu là 10.000 VNĐ/ngày và thời gian ít nhất 1 ngày.';
    if (step === 5 && (!campaign.title.trim() || !campaign.content.trim())) return 'Vui lòng hoàn thiện tiêu đề và nội dung quảng cáo.';
    return null;
  };
  const next = () => {
    const error = validate();
    if (error) return setNotice({ type: 'error', text: error });
    setNotice(null); setStep((value) => Math.min(8, value + 1));
  };
  const previous = () => { setNotice(null); setStep((value) => Math.max(1, value - 1)); };
  const saveCampaign = async () => {
    const error = validate();
    if (error) return setNotice({ type: 'error', text: error });
    const saved = { ...campaign, id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'Chờ phê duyệt' };
    const nextCampaigns = [saved, ...campaigns];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCampaigns));
    setCampaigns(nextCampaigns);
    setSending(true); setNotice({ type: 'success', text: 'Đã lưu chiến dịch. Đang gửi thông báo Telegram thật...' });
    try {
      const response = await fetch('/api/telegram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaign: saved }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gửi Telegram thất bại.');
      setNotice({ type: 'success', text: 'Đã lưu chiến dịch và gửi thông báo Telegram thành công.' });
    } catch (error) {
      setNotice({ type: 'warning', text: `Chiến dịch đã được lưu, nhưng ${error.message}` });
    } finally { setSending(false); }
  };

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><Megaphone size={22} /></div><div><strong>BAHA Group</strong><span>Thiết lập quảng cáo dễ dàng</span></div></div>
      <div className="safe-pill"><ShieldCheck size={17} /> Chế độ an toàn: Mô phỏng</div>
    </header>
    <section className="hero"><div><p className="eyebrow">BẮT ĐẦU TRONG VÀI PHÚT</p><h1>Tạo chiến dịch quảng cáo<br /><em>thật đơn giản</em></h1><p className="hero-copy">Chúng tôi sẽ đồng hành cùng bạn qua 8 bước. Không cần biết marketing, chỉ cần hiểu khách hàng của mình.</p></div><div className="hero-badge"><Sparkles size={24} /><span>Meta Ads<br /><b>Mô phỏng an toàn</b></span></div></section>
    <section className="wizard-card">
      <nav className="stepper">{steps.map(([label, Icon], index) => <button key={label} className={step === index + 1 ? 'step active' : step > index + 1 ? 'step completed' : 'step'} onClick={() => index + 1 < step && setStep(index + 1)}><span className="step-icon">{step > index + 1 ? <Check size={16} /> : <Icon size={16} />}</span><span className="step-label">{index + 1}. {label}</span></button>)}</nav>
      {notice && <div className={`notice ${notice.type}`}><CircleHelp size={18} />{notice.text}</div>}
      <div className="content">{renderStep(step, campaign, update, total, campaigns)}</div>
      <footer className="wizard-footer"><button className="button secondary" onClick={previous} disabled={step === 1}><ArrowLeft size={18} /> Quay lại</button><span className="step-count">Bước {step} / 8</span>{step < 7 && <button className="button primary" onClick={next}>Tiếp tục <ArrowRight size={18} /></button>}{step === 7 && <button className="button primary" onClick={() => { const error = validate(); if (error) setNotice({ type: 'error', text: error }); else setStep(8); }}>Xác nhận để lưu <Check size={18} /></button>}{step === 8 && <button className="button primary" onClick={saveCampaign} disabled={sending}><Bell size={18} /> {sending ? 'Đang gửi...' : 'Lưu và gửi Telegram'}</button>}</footer>
    </section>
    <p className="footer-note"><ShieldCheck size={15} /> An toàn tài chính: Chưa có quảng cáo nào được chạy và chưa phát sinh chi phí.</p>
  </main>;
}

function Field({ label, hint, children }) { return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
function renderStep(step, c, update, total, campaigns) {
  if (step === 1) return <><StepHeading icon={FileText} title="Thông tin dịch vụ" subtitle="Hãy cho chúng tôi biết bạn muốn giới thiệu sản phẩm hoặc dịch vụ nào." /><div className="form-grid"><Field label="Tên sản phẩm / dịch vụ *"><input value={c.name} onChange={(e) => update('name', e.target.value)} placeholder="Ví dụ: Chăm sóc sắc đẹp" /></Field><Field label="Mô tả ngắn *" hint="Mô tả rõ ràng giúp khách hàng hiểu bạn cung cấp gì."><textarea value={c.description} onChange={(e) => update('description', e.target.value)} rows="4" placeholder="Viết một vài câu đơn giản..." /></Field></div><div className="upload-box"><ImagePlus size={24} /><div><b>Thêm hình ảnh hoặc video (không bắt buộc)</b><small>Trong bản mô phỏng, bạn có thể bổ sung sau.</small></div><button className="button secondary">Chọn tệp</button></div></>;
  if (step === 2) return <><StepHeading icon={Target} title="Bạn muốn đạt được điều gì?" subtitle="Chọn kết quả quan trọng nhất với cửa hàng của bạn." /><div className="choice-grid">{['Có thêm khách hàng liên hệ tư vấn', 'Tăng số người ghé thăm trang', 'Tăng số đơn hàng'].map((value, i) => <button className={c.objective === value ? 'choice selected' : 'choice'} key={value} onClick={() => update('objective', value)}><span className="choice-number">0{i + 1}</span><strong>{value}</strong><small>{['Khách hàng nhắn tin hoặc gọi cho bạn.', 'Nhiều người biết đến dịch vụ hơn.', 'Khuyến khích khách hàng mua hàng.'][i]}</small>{c.objective === value && <CheckCircle2 className="choice-check" size={20} />}</button>)}</div></>;
  if (step === 3) return <><StepHeading icon={Users} title="Bạn muốn tiếp cận ai?" subtitle="Chọn khu vực và mô tả nhóm khách hàng phù hợp nhất." /><div className="form-grid two"><Field label="Khu vực *"><div className="input-icon"><MapPin size={18} /><input value={c.location} onChange={(e) => update('location', e.target.value)} /></div></Field><Field label="Độ tuổi tham khảo"><select value={c.ageRange} onChange={(e) => update('ageRange', e.target.value)}><option>18 - 30 tuổi</option><option>25 - 55 tuổi</option><option>35 - 65 tuổi</option><option>Mọi độ tuổi</option></select></Field></div><Field label="Nhóm khách hàng bạn muốn tìm"><input value={c.audience} onChange={(e) => update('audience', e.target.value)} /></Field><div className="tip"><Sparkles size={18} /><span><b>Gợi ý của BAHA:</b> Với dịch vụ làm đẹp tại TP.HCM, nhóm phụ nữ 25 - 55 tuổi thường là lựa chọn phù hợp để bắt đầu.</span></div></>;
  if (step === 4) return <><StepHeading icon={Wallet} title="Ngân sách và thời gian" subtitle="Bạn luôn kiểm soát được số tiền dự kiến. Không có khoản tiền nào bị trừ tự động." /><div className="budget-box"><Field label="Ngân sách mỗi ngày *" hint="Nên bắt đầu với số tiền vừa phải để thử nghiệm."><div className="money-input"><input type="number" min="10000" value={c.budget} onChange={(e) => update('budget', Number(e.target.value))} /><b>VNĐ / ngày</b></div></Field><Field label="Số ngày dự kiến *"><div className="money-input"><input type="number" min="1" value={c.duration} onChange={(e) => update('duration', Number(e.target.value))} /><b>ngày</b></div></Field></div><div className="total-box"><span>Tổng ngân sách dự kiến</span><strong>{money(total)}</strong><small>Đây chỉ là phép tính tham khảo trong bản mô phỏng.</small></div></>;
  if (step === 5) return <><StepHeading icon={Sparkles} title="Hoàn thiện nội dung" subtitle="Chúng tôi đã gợi ý nội dung. Bạn có thể sửa lại cho đúng với cách nói của mình." /><Field label="Tiêu đề quảng cáo *"><input value={c.title} onChange={(e) => update('title', e.target.value)} /></Field><Field label="Nội dung quảng cáo *"><textarea value={c.content} onChange={(e) => update('content', e.target.value)} rows="5" /></Field><Field label="Nút kêu gọi hành động"><select value={c.cta} onChange={(e) => update('cta', e.target.value)}><option>Nhắn tin tư vấn</option><option>Đặt lịch ngay</option><option>Tìm hiểu thêm</option></select></Field></>;
  if (step === 6) return <><StepHeading icon={Eye} title="Xem trước quảng cáo" subtitle="Đây là hình ảnh mô phỏng. Quảng cáo chưa được gửi lên Meta và chưa chạy thật." /><div className="preview-wrap"><div className="preview-card"><div className="preview-head"><div className="avatar">B</div><div><b>{c.name || 'Tên cửa hàng'}</b><small>Được tài trợ · Mô phỏng</small></div><span>•••</span></div><div className="preview-image"><Sparkles size={38} /><b>Hình ảnh dịch vụ của bạn</b><small>Hình ảnh thật có thể thêm sau</small></div><div className="preview-text"><h3>{c.title}</h3><p>{c.content}</p></div><div className="preview-cta"><span>{c.location} · {c.objective}</span><button>{c.cta}</button></div></div><div className="preview-side"><div className="tag"><ShieldCheck size={18} /> Mô phỏng an toàn</div><p>Chỉ khi được phê duyệt riêng, bạn mới có thể cân nhắc chạy quảng cáo thật trên nền tảng.</p></div></div></>;
  if (step === 7) return <><StepHeading icon={ShieldCheck} title="Kiểm tra trước khi lưu" subtitle="Hãy xem lại lần cuối. Chiến dịch sẽ được lưu ở trạng thái Chờ phê duyệt." /><div className="review-grid">{[['Dịch vụ', c.name], ['Mục tiêu', c.objective], ['Khu vực', `${c.location} · ${c.ageRange}`], ['Ngân sách', `${money(c.budget)} × ${c.duration} ngày`], ['Tổng dự kiến', money(total)], ['Nút hành động', c.cta]].map(([label, value]) => <div className="review-item" key={label}><small>{label}</small><b>{value}</b></div>)}</div><div className="safety-alert"><ShieldCheck size={22} /><div><b>Cam kết an toàn</b><p>BAHA chỉ lưu cấu hình mô phỏng. Chưa có quảng cáo nào được kích hoạt, không gọi API Meta và không phát sinh chi phí.</p></div></div></>;
  return <><StepHeading icon={Bell} title="Quản lý chiến dịch" subtitle="Chiến dịch đã lưu sẽ nằm ở đây. Bạn có thể gửi thông báo thật cho người quản lý qua Telegram." /><div className="telegram-box"><MessageCircle size={25} /><div><b>Telegram · Gửi thật</b><p>Thông báo chỉ được gửi sau khi bạn bấm nút bên dưới. Token được bảo vệ ở máy chủ.</p></div></div>{campaigns.length === 0 ? <div className="empty"><FileText size={30} /><p>Chưa có chiến dịch nào được lưu.</p></div> : <div className="campaign-list">{campaigns.slice(0, 5).map((item) => <div className="campaign-row" key={item.id}><div><b>{item.name}</b><small>{item.location} · {money(item.budget)}/ngày · {item.duration} ngày</small></div><span className="status">{item.status}</span></div>)}</div>}</>;
}
function StepHeading({ icon: Icon, title, subtitle }) { return <div className="step-heading"><div className="heading-icon"><Icon size={24} /></div><div><h2>{title}</h2><p>{subtitle}</p></div></div>; }
