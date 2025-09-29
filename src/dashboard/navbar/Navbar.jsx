import React from 'react';
import { Menu } from 'antd';
import { HomeOutlined, InfoCircleOutlined, PhoneOutlined } from '@ant-design/icons';
import './Navbar.css'; // cesta k CSS ve složce styles

function Navbar() {
  return (
    <div className="navbar">
      <div className="logo">Moje Banka</div>
      <Menu mode="horizontal" theme="dark">
        <Menu.Item key="home" icon={<HomeOutlined />}>
          Domů
        </Menu.Item>
        <Menu.Item key="about" icon={<InfoCircleOutlined />}>
          O nás
        </Menu.Item>
        <Menu.Item key="contact" icon={<PhoneOutlined />}>
          Kontakt
        </Menu.Item>
      </Menu>
    </div>
  );
}

export default Navbar;
