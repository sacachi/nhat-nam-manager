export const ACCEPTED_RESPONSE_STATUSES = [200, 202] as const

export class UnexpectedResponseStatusError extends Error {
  status: number

  constructor(status: number, message?: string) {
    super(message || `Request failed with status ${status}`)
    this.name = 'UnexpectedResponseStatusError'
    this.status = status
  }
}

export const ensureAcceptedResponseStatus = (
  status: number,
  acceptedStatuses: readonly number[] = ACCEPTED_RESPONSE_STATUSES
) => {
  if (!acceptedStatuses.includes(status)) {
    throw new UnexpectedResponseStatusError(status)
  }
}

export const getRequestErrorMessage = (error: any, fallbackMessage = 'Yêu cầu thất bại') => {
  return (
    error?.data?.statusMessage ||
    error?.data?.message ||
    error?.statusMessage ||
    error?.message ||
    fallbackMessage
  )
}