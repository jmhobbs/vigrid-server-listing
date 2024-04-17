export default function filteredState(servers, filters) {
  return [...servers].filter((server) => {
    return ! Object.entries(filters).some(([field, value]) => {
      return server[field].toString() !== value
    })
  });
}
