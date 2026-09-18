export function ErrorMessage({ message, id }: { message: string; id?: string }) {
  return <p id={id} className="error-message" role="alert" aria-atomic="true"><span aria-hidden="true">ⓘ </span>{message}</p>
}
