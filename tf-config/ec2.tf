resource "aws_instance" "app" {
  ami                                  = "ami-084a56dceed3eb9bb"
  associate_public_ip_address          = true
  availability_zone                    = "ap-northeast-2a"
  disable_api_stop                     = false
  disable_api_termination              = false
  ebs_optimized                        = true
  force_destroy                        = false
  get_password_data                    = false
  hibernation                          = false
  instance_initiated_shutdown_behavior = "stop"
  instance_type                        = "t3.small"
  key_name                             = "capstone"
  monitoring                           = false
  private_ip                           = "10.1.0.163"
  secondary_private_ips                = []
  source_dest_check                    = true
  subnet_id                            = "subnet-004a0088e7dcc6374"
  tags = {
    Name = "2026capstone-양선민"
  }
  tags_all = {
    Name = "2026capstone-양선민"
  }
  tenancy                     = "default"
  vpc_security_group_ids      = ["sg-05126276eab1ae2af"]
  capacity_reservation_specification {
    capacity_reservation_preference = "open"
  }
  cpu_options {
    core_count       = 1
    threads_per_core = 2
  }
  credit_specification {
    cpu_credits = "unlimited"
  }
  enclave_options {
    enabled = false
  }
  maintenance_options {
    auto_recovery = "default"
  }
  metadata_options {
    http_endpoint               = "enabled"
    http_protocol_ipv6          = "disabled"
    http_put_response_hop_limit = 2
    http_tokens                 = "required"
    instance_metadata_tags      = "disabled"
  }
  private_dns_name_options {
    enable_resource_name_dns_a_record    = false
    enable_resource_name_dns_aaaa_record = false
    hostname_type                        = "ip-name"
  }
  root_block_device {
    delete_on_termination = true
    encrypted             = false
    iops                  = 3000
    tags                  = {}
    tags_all              = {}
    throughput            = 125
    volume_size           = 8
    volume_type           = "gp3"
  }
}
