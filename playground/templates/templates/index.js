export default function (opts) {
  const { users } = opts;
  return `
    <ul>
      ${users.map(user => `<li>${user}</li>`).join('\n')}
    </ul>
  `;
};
