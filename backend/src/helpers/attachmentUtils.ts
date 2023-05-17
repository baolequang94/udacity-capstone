import * as AWS from 'aws-sdk'
const AWSXRay = require('aws-xray-sdk')

const XAWS = AWSXRay.captureAWS(AWS)

const s3Bucket = process.env.ATTACHMENT_S3_BUCKET
const urlExpireTime = process.env.SIGNED_URL_EXPIRATION

export class AttachmentUtils {
  constructor(
    private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' }),
    private readonly bucketName = s3Bucket
  ) {}

  getAttachmentUrl(todoId: string): string {
    return `https://${this.bucketName}.s3.amazonaws.com/${todoId}`
  }

  getUploadUrl(todoId: string): string {
    const signedUrl = this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: todoId,
      Expires: parseInt(urlExpireTime)
    })

    return signedUrl
  }

  async deletePhotoFile(todoId: string): Promise<void> {
    this.s3.deleteObject({
      Bucket: this.bucketName,
      Key: todoId
    })
  }
}
