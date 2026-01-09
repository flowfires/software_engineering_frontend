import React, { useState } from 'react'
import { Modal, Upload, Button, message, Form, Input } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import api from '../services/api'

export default function ResourceUpload({ visible, onCancel, onUploaded }) {
  const [fileList, setFileList] = useState([])
  const [uploading, setUploading] = useState(false)
  const [name, setName] = useState('')
  const [tags, setTags] = useState('')

  const handleUpload = async () => {
    if (!fileList.length) return message.error('请先选择文件')
    const file = fileList[0]
    const form = new FormData()
    form.append('file', file)
    form.append('name', name)
    form.append('tags', tags)

    setUploading(true)
    try {
      await api.post('/resource/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          // Could surface progress if desired
        }
      })
      message.success('上传成功（如果后端实现）')
      // if tags provided, try to create tags via API so they show in tag list
      if (tags && tags.trim()) {
        const arr = tags.split(',').map(s => s.trim()).filter(Boolean)
        for (const t of arr) {
          try {
            await api.post('/resource/tags', { tag: t })
          } catch (e) {
            // ignore
          }
        }
      }
      setFileList([])
      setName('')
      setTags('')
      onUploaded && onUploaded()
    } catch (err) {
      message.error(err?.response?.data?.detail || '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const props = {
    beforeUpload: (file) => {
      setFileList([file])
      return false
    },
    fileList,
    onRemove: () => setFileList([])
  }

  return (
    <Modal
      title="上传资源"
      open={visible}
      onOk={handleUpload}
      onCancel={onCancel}
      okText="上传"
      confirmLoading={uploading}
      destroyOnClose
    >
      <Form layout="vertical">
        <Form.Item label="资源文件">
          <Upload {...props} maxCount={1}>
            <Button icon={<UploadOutlined />}>选择文件</Button>
          </Upload>
        </Form.Item>
        <Form.Item label="名称（可选）">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Form.Item>
        <Form.Item label="标签（逗号分隔，可选）">
          <Input value={tags} onChange={(e) => setTags(e.target.value)} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
