import React, { useState } from 'react'
import { Modal, Form, Input, Select, Switch, Button, Image, message, Spin, Alert, Card, Row, Col } from 'antd'
import { ThunderboltOutlined, PictureOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons'
import api from '../services/api'

const { TextArea } = Input

export default function AiImageGenerator({ visible, onCancel }) {
  const [loading, setLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [form] = Form.useForm()

  const handleGenerate = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      setGeneratedImage(null)

      // 调用文生图 API
      const resp = await api.post('/media/image/generate', {
        prompt: values.prompt,
        size: values.size || '1024x1024',
        quality: values.quality || 'standard',
        optimize_prompt: values.optimize_prompt ?? true,
        watermark_enabled: false
      })

      if (resp.data && resp.data.image_url) {
        setGeneratedImage(resp.data.image_url)
        message.success('图片生成成功')
      } else {
        message.error('生成失败，未返回图片地址')
      }
    } catch (err) {
      console.error(err)
      message.error(err?.response?.data?.detail || '生成请求失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyUrl = () => {
    if (generatedImage) {
      navigator.clipboard.writeText(generatedImage)
      message.success('图片地址已复制')
    }
  }

  return (
    <Modal
      title={<span><ThunderboltOutlined style={{ color: '#faad14', marginRight: 8 }} />AI 素材生成器</span>}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Row gutter={24}>
        {/* 左侧：配置表单 */}
        <Col xs={24} md={10}>
          <Alert message="输入描述，AI 将为您生成专属教学素材。" type="info" showIcon style={{ marginBottom: 16 }} />
          <Form form={form} layout="vertical" initialValues={{ size: '1024x1024', quality: 'standard', optimize_prompt: true }}>
            <Form.Item 
              name="prompt" 
              label="画面描述 (Prompt)" 
              rules={[{ required: true, message: '请输入画面描述' }]}
            >
              <TextArea 
                rows={6} 
                placeholder="例如：一只在黑板上写数学公式的卡通猫，色彩鲜艳，3D 风格..." 
                maxLength={1000} 
                showCount 
              />
            </Form.Item>

            <Form.Item label="高级设置" style={{ marginBottom: 0 }}>
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item name="size" label="尺寸">
                    <Select>
                      <Select.Option value="1024x1024">1024x1024 (方)</Select.Option>
                      <Select.Option value="768x1024">768x1024 (竖)</Select.Option>
                      <Select.Option value="1024x768">1024x768 (横)</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="quality" label="画质">
                    <Select>
                      <Select.Option value="standard">标准</Select.Option>
                      <Select.Option value="hd">高清</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Form.Item>

            <Form.Item name="optimize_prompt" valuePropName="checked" label="智能优化提示词">
               <Switch checkedChildren="开启" unCheckedChildren="关闭" />
            </Form.Item>

            <Button type="primary" block onClick={handleGenerate} loading={loading} icon={<ThunderboltOutlined />} size="large" style={{ marginTop: 16 }}>
              立即生成
            </Button>
          </Form>
        </Col>

        {/* 右侧：结果展示 */}
        <Col xs={24} md={14} style={{ borderLeft: '1px solid #f0f0f0' }}>
           <div style={{ height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#fafafa', borderRadius: 8, padding: 16 }}>
             {loading ? (
               <div style={{ textAlign: 'center' }}>
                 <Spin size="large" />
                 <div style={{ marginTop: 16, color: '#999' }}>AI 正在绘制中，请稍候...</div>
               </div>
             ) : generatedImage ? (
               <div style={{ width: '100%', textAlign: 'center' }}>
                 <Image 
                   src={generatedImage} 
                   style={{ maxWidth: '100%', maxHeight: 350, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                 />
                 <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 16 }}>
                   <Button icon={<CopyOutlined />} onClick={handleCopyUrl}>复制链接</Button>
                   <Button icon={<DownloadOutlined />} href={generatedImage} target="_blank">下载原图</Button>
                 </div>
               </div>
             ) : (
               <div style={{ textAlign: 'center', color: '#ccc' }}>
                 <PictureOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                 <p>生成的图片将显示在这里</p>
               </div>
             )}
           </div>
        </Col>
      </Row>
    </Modal>
  )
}