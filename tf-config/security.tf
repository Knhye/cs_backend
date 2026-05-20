resource "aws_security_group" "app" {
  description = "2026 capstone yanseonmin ec2 security group"
  egress = [{
    cidr_blocks      = ["0.0.0.0/0"]
    description      = ""
    from_port        = 0
    ipv6_cidr_blocks = []
    prefix_list_ids  = []
    protocol         = "-1"
    security_groups  = []
    self             = false
    to_port          = 0
  }]
  ingress = [{
    cidr_blocks      = ["0.0.0.0/0"]
    description      = ""
    from_port        = 22
    ipv6_cidr_blocks = []
    prefix_list_ids  = []
    protocol         = "tcp"
    security_groups  = []
    self             = false
    to_port          = 22
    }, {
    cidr_blocks      = ["0.0.0.0/0"]
    description      = ""
    from_port        = 30007
    ipv6_cidr_blocks = []
    prefix_list_ids  = []
    protocol         = "tcp"
    security_groups  = []
    self             = false
    to_port          = 30007
    }, {
    cidr_blocks      = ["0.0.0.0/0"]
    description      = ""
    from_port        = 30080
    ipv6_cidr_blocks = []
    prefix_list_ids  = []
    protocol         = "tcp"
    security_groups  = []
    self             = false
    to_port          = 30080
    }, {
    cidr_blocks      = ["0.0.0.0/0"]
    description      = ""
    from_port        = 443
    ipv6_cidr_blocks = []
    prefix_list_ids  = []
    protocol         = "tcp"
    security_groups  = []
    self             = false
    to_port          = 443
    }, {
    cidr_blocks      = ["0.0.0.0/0"]
    description      = ""
    from_port        = 80
    ipv6_cidr_blocks = []
    prefix_list_ids  = []
    protocol         = "tcp"
    security_groups  = []
    self             = false
    to_port          = 80
    }, {
    cidr_blocks      = [var.allowed_k3s_api_cidr]
    description      = ""
    from_port        = 6443
    ipv6_cidr_blocks = []
    prefix_list_ids  = []
    protocol         = "tcp"
    security_groups  = []
    self             = true
    to_port          = 6443
    }, {
    cidr_blocks      = []
    description      = ""
    from_port        = 10250
    ipv6_cidr_blocks = []
    prefix_list_ids  = []
    protocol         = "tcp"
    security_groups  = []
    self             = true
    to_port          = 10250
    }, {
    cidr_blocks      = []
    description      = ""
    from_port        = 8472
    ipv6_cidr_blocks = []
    prefix_list_ids  = []
    protocol         = "udp"
    security_groups  = []
    self             = true
    to_port          = 8472
  }]
  name                   = "YsmEC2SecurityGroup"
  region                 = "ap-northeast-2"
  revoke_rules_on_delete = null
  tags = {
    Name = "2026capstone-양선민"
  }
  tags_all = {
    Name = "2026capstone-양선민"
  }
  vpc_id = "vpc-07101c34140caeaef"
}