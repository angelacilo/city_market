export function IconGrain() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 4C10 6 8 9 8 12c0 2 1 4 4 4s4-2 4-4c0-3-2-6-4-8z" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-green-700" />
      <path d="M12 8c-1 2-2 3-2 5M12 8c1 2 2 3 2 5" stroke="currentColor" strokeWidth="1.2" className="text-green-600" />
    </svg>
  )
}

export function IconMeat() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M8 10c0-2 2-4 4-4s4 2 4 4v2c0 2-2 4-4 4H8c-2 0-4-2-4-4v-2h4z" stroke="currentColor" strokeWidth="1.5" className="text-red-600" />
      <path d="M10 14l4-4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

export function IconFish() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M4 12c2-3 6-5 10-3l2-2 2 2-2 2c2 4-2 6-5 5-3-1-5-2-7-4z" stroke="currentColor" strokeWidth="1.5" className="text-blue-600" />
      <circle cx="7" cy="11" r="1" fill="currentColor" className="text-blue-500" />
    </svg>
  )
}

export function IconLeaf() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 20C12 14 14 8 20 6c0 6-4 12-8 14-2-2-3-5-2-8" stroke="currentColor" strokeWidth="1.5" className="text-green-600" />
    </svg>
  )
}

export function IconApple() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 5c1-2 3-2 4-1-.5 2-2 3-4 3-2 0-3.5-1-4-3 1-1 3-1 4 1z" fill="currentColor" className="text-orange-500" />
      <path d="M12 7c-4 0-6 4-5 8 1 4 4 6 5 6s4-2 5-6c1-4-1-8-5-8z" stroke="currentColor" strokeWidth="1.5" className="text-orange-600" />
    </svg>
  )
}

export function IconBox() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M4 8l8 4 8-4-8-4-8 4z" stroke="currentColor" strokeWidth="1.5" className="text-purple-600" />
      <path d="M4 8v8l8 4v-8M12 12l8-4v8l-8 4" stroke="currentColor" strokeWidth="1.5" className="text-purple-600" />
    </svg>
  )
}

export function IconBottle() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M10 3h4v3l2 3v12H10V9l2-3V3z" stroke="currentColor" strokeWidth="1.5" className="text-pink-600" />
    </svg>
  )
}

export function IconGridDots() {
  const dots = [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => ({ r, c })))
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {dots.map(({ r, c }) => (
        <circle
          key={`${r}-${c}`}
          cx={6 + c * 6}
          cy={6 + r * 6}
          r="1.5"
          fill="currentColor"
          className="text-gray-500"
        />
      ))}
    </svg>
  )
}
