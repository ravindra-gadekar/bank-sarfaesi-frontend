import { UserMessage } from './types';

export default function UserBubble({ message }: { message: UserMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] bg-sand-200 dark:bg-dark-surface-hover rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-ink dark:text-dark-text">
        {message.text}
      </div>
    </div>
  );
}
