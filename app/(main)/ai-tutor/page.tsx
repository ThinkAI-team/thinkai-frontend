'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

const suggestedActions = [
  { icon: '🔄', text: 'Giải thích lại đơn giản hơn' },
  { icon: '👤', text: 'Cho tôi ví dụ thực tế' },
  { icon: '📝', text: 'Tạo bài tập thực hành' },
];

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'user',
      content: 'Minh đang gặp khó khăn với bài toán xác suất thống kê này. Bạn giúp mình giải thích định lý Bayes được không?'
    },
    {
      id: 2,
      role: 'assistant',
      content: `Chào bạn! Rất sẵn lòng. **Định lý Bayes** là một công cụ cực kỳ mạnh mẽ để cập nhật xác suất của một giả thuyết khi chúng ta có thêm bằng chứng mới.

Công thức cơ bản là:

\`\`\`
P(A|B) = [P(B|A) * P(A)] / P(B)
\`\`\`

• **P(A|B):** Xác suất xảy ra A khi biết B đã xảy ra.
• **P(B|A):** Xác suất xảy ra B khi biết A đã xảy ra.
• **P(A) & P(B):** Xác suất ban đầu của A và B.

Bạn có muốn mình lấy một ví dụ thực tế về xét nghiệm y tế để dễ hình dung hơn không?`
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    const newMessage: Message = {
      id: messages.length + 1,
      role: 'user',
      content: inputValue
    };
    setMessages([...messages, newMessage]);
    setInputValue('');
    // TODO: Call AI API
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🎯</span>
          <span className={styles.logoText}>ThinkAI</span>
        </Link>
        
        <nav className={styles.nav}>
          <Link href="/courses">Lộ trình học</Link>
          <Link href="/library">Thư viện</Link>
          <Link href="/progress">Tiến độ</Link>
        </nav>
        
        <div className={styles.headerActions}>
          <button className={styles.themeBtn}>🌙</button>
          <Link href="/pricing" className={styles.upgradeBtn}>
            Nâng cấp →
          </Link>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className={styles.main}>
        {/* Welcome */}
        <div className={styles.welcome}>
          <h1>Hôm nay chúng ta học gì, <em>Minh?</em></h1>
          <p>Tôi sẵn sàng hỗ trợ bạn giải bài tập Toán, Luyện viết Tiếng Anh hay<br/>ôn tập Lịch Sử.</p>
        </div>

        {/* Messages */}
        <div className={styles.messages}>
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`${styles.message} ${styles[msg.role]}`}
            >
              {msg.role === 'assistant' && (
                <div className={styles.avatarIcon}>🎯</div>
              )}
              <div className={styles.messageContent}>
                {msg.content.split('\n').map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </div>
          ))}

          {/* Suggested Actions */}
          <div className={styles.suggestedActions}>
            {suggestedActions.map((action, idx) => (
              <button key={idx} className={styles.actionBtn}>
                <span>{action.icon}</span> {action.text}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className={styles.inputArea}>
          <div className={styles.inputWrapper}>
            <button type="button" className={styles.attachBtn}>⊕</button>
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Hỏi ThinkAI bất cứ điều gì..."
              className={styles.chatInput}
            />
            <button type="submit" className={styles.sendBtn}>
              ➤
            </button>
          </div>
          <p className={styles.disclaimer}>
            ThinkAI có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.
          </p>
        </form>
      </main>
    </div>
  );
}
