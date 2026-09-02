import React from 'react';

export const UserAvatar = ({ user, name, avatar, role, className = "w-8 h-8 text-xs", onClick = null }) => {
  const targetName = user?.name || name || 'User';
  const targetAvatar = (user?.avatar !== undefined ? user.avatar : avatar) || '';
  const targetRole = user?.role || role || 'STUDENT';
  
  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };
  
  const initials = getInitials(targetName);
  
  const roleGradients = {
    ADMIN: 'bg-gradient-to-tr from-amber-600 via-purple-600 to-indigo-600 text-amber-100 border border-amber-400/40 shadow-glow-amber',
    TEACHER: 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-600 text-purple-100 border border-purple-400/40 shadow-glow-purple',
    STUDENT: 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 text-emerald-100 border border-emerald-400/40 shadow-glow-emerald'
  };
  
  const gradientStyle = roleGradients[targetRole] || roleGradients.STUDENT;

  if (targetAvatar && targetAvatar.trim().length > 0) {
    return (
      <img
        src={targetAvatar}
        alt={targetName}
        onClick={onClick}
        className={`${className} rounded-full object-cover ring-2 ring-indigo-500/40 shrink-0 ${onClick ? 'cursor-pointer hover:ring-indigo-400' : ''}`}
        onError={(e) => {
          e.target.style.display = 'none';
          if (e.target.nextElementSibling) {
            e.target.nextElementSibling.style.display = 'flex';
          }
        }}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      className={`${className} rounded-full flex items-center justify-center font-black tracking-wider uppercase shrink-0 select-none ${gradientStyle} ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
      title={`${targetName} (${targetRole})`}
    >
      {initials}
    </div>
  );
};
