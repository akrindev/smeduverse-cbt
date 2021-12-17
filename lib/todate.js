const toDate = (day) => {
  const date = new Date(day).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
  });

  return date
}

export {
    toDate
}