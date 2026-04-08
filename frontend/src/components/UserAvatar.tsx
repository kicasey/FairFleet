interface UserAvatarProps {
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { container: 'h-8 w-8', text: 'text-xs' },
  md: { container: 'h-10 w-10', text: 'text-sm' },
  lg: { container: 'h-14 w-14', text: 'text-lg' },
} as const;

export default function UserAvatar({ name = 'Guest', size = 'md' }: Readonly<UserAvatarProps>) {
  const { container, text } = sizeMap[size];
  const initial = name.charAt(0).toUpperCase();

  return (
    <div
      className={`${container} gradient-primary flex items-center justify-center rounded-full shrink-0`}
    >
      <span className={`${text} font-display font-bold text-white leading-none`}>
        {initial}
      </span>
    </div>
  );
}
