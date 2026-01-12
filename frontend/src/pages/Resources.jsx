// src/pages/Resources.jsx
import React from 'react';
import { Card, Typography, Row, Col, theme } from 'antd';
import { FileImageOutlined, VideoCameraOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const Resources = () => {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  // 定义导航卡片数据
  const features = [
    {
      title: 'AI 图片生成',
      desc: '输入描述词，快速生成高质量的教案配图或课件插画。',
      icon: <FileImageOutlined style={{ fontSize: '48px', color: '#1890ff' }} />,
      path: '/resources/image',
      color: '#e6f7ff',
    },
    {
      title: 'AI 视频生成',
      desc: '描述动态场景，AI 自动为您生成短视频素材，丰富教学内容。',
      icon: <VideoCameraOutlined style={{ fontSize: '48px', color: '#722ed1' }} />,
      path: '/resources/video',
      color: '#f9f0ff',
    },
  ];

  return (
    <div style={{ padding: '40px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 50 }}>
        <Title level={2}>AI 素材工坊</Title>
        <Paragraph type="secondary" style={{ fontSize: '16px' }}>
          请选择您需要生成的素材类型
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        {features.map((item) => (
          <Col xs={24} md={12} key={item.path}>
            <Card
              hoverable
              style={{ height: '100%', borderRadius: '12px', border: 'none', boxShadow: token.boxShadowSecondary }}
              bodyStyle={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
              onClick={() => navigate(item.path)}
            >
              <div style={{ 
                marginBottom: '24px', 
                padding: '24px', 
                background: item.color, 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100px',
                height: '100px'
              }}>
                {item.icon}
              </div>
              <Title level={4}>{item.title}</Title>
              <Paragraph type="secondary" style={{ marginBottom: '24px', flex: 1 }}>
                {item.desc}
              </Paragraph>
              <div style={{ color: token.colorPrimary, fontWeight: 500 }}>
                立即开始 <ArrowRightOutlined />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Resources;