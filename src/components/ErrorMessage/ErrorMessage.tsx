export function ErrorMessage({ message }: { message: string }) {
  return <p className="error-message" role="alert"><span aria-hidden="true">ⓘ </span>{message}</p>
}
