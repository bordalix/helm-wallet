function LogoGenericIcon() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6' viewBox='0 0 32 32'>
      <circle cx='16' cy='16' r='10' fill='currentColor' />
    </svg>
  )
}

export function LogoStartIcon() {
  return (
    <div className='text-gray-800 dark:text-gray-200'>
      <LogoGenericIcon />
    </div>
  )
}

export function LogoSuccessIcon() {
  return (
    <div className='text-green-500'>
      <LogoGenericIcon />
    </div>
  )
}

export function LogoRunningIcon() {
  return (
    <div className='text-gray-800 dark:text-gray-200'>
      <svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6' viewBox='0 0 32 32'>
        <line x1='16' y1='8' x2='16' y2='2' stroke='currentColor' />
        <circle cx='16' cy='16' r='8' fill='none' strokeWidth='2' stroke='currentColor' />
        <line x1='16' y1='24' x2='16' y2='30' stroke='currentColor' />
      </svg>
    </div>
  )
}

export function LogoErrorIcon() {
  return (
    <div className='text-red-500'>
      <LogoGenericIcon />
    </div>
  )
}

export function LogoInfoIcon() {
  return (
    <div className='text-gray-300 dark:text-gray-600'>
      <LogoGenericIcon />
    </div>
  )
}

export function LogoFailIcon() {
  return (
    <div className='text-red-500'>
      <LogoGenericIcon />
    </div>
  )
}
