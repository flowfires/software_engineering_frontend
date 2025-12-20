import React from 'react'
import { Modal, Form, Input, Select } from 'antd'
import api from '../services/api'

const { Option } = Select

export default function CourseForm({ visible, onCancel, onCreated }) {
  const [form] = Form.useForm()

  const submit = async () => {
    const vals = await form.validateFields()
    try {
      await api.post('/course', vals)
      form.resetFields()
      onCreated()
    } catch (err) {
      Modal.error({ title: '创建失败', content: err?.response?.data?.detail || '创建课程失败' })
    }
  }

  return (
    <Modal title="新建课程" open={visible} onOk={submit} onCancel={onCancel} destroyOnClose>
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="课程名称" rules={[{ required: true }]}> <Input /> </Form.Item>
        <Form.Item name="subject" label="科目"> <Input /> </Form.Item>
        <Form.Item name="grade" label="年级"> <Input /> </Form.Item>
        <Form.Item name="description" label="简介"> <Input.TextArea rows={3} /> </Form.Item>
      </Form>
    </Modal>
  )
}
