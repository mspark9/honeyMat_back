/**
 * S3 URL을 CloudFront URL로 변환
 * @param {string} s3Url - S3 버킷 URL
 * @returns {string} - CloudFront URL 또는 원본 URL
 */
export function toCloudFrontUrl(s3Url) {
  if (!s3Url || !process.env.AWS_CLOUDFRONT_URL) {
    return s3Url;
  }

  // S3 URL 패턴: https://bucket-name.s3.region.amazonaws.com/key
  // 또는: https://s3.region.amazonaws.com/bucket-name/key
  const s3Pattern = /https?:\/\/[^/]+\.amazonaws\.com\/(.+)/;
  const match = s3Url.match(s3Pattern);

  if (match && match[1]) {
    return `${process.env.AWS_CLOUDFRONT_URL}/${match[1]}`;
  }

  return s3Url;
}
