import Button from './Button';
import styles from './PageState.module.css';

type PageStateType = 'loading' | 'error' | 'empty';

interface PageStateProps {
  type: PageStateType;
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const defaultTitleByType: Record<PageStateType, string> = {
  loading: 'Đang tải dữ liệu',
  error: 'Không thể tải dữ liệu',
  empty: 'Chưa có dữ liệu',
};

export default function PageState({
  type,
  title,
  message,
  actionLabel,
  onAction,
}: PageStateProps) {
  return (
    <section className={`${styles.state} ${styles[type]}`}>
      <h3 className={styles.title}>{title || defaultTitleByType[type]}</h3>
      <p className={styles.message}>{message}</p>
      {actionLabel && onAction && (
        <Button variant={type === 'error' ? 'primary' : 'secondary'} size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </section>
  );
}
