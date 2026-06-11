# --------------------------------------------------------------------------- #
# Application Load Balancer
# --------------------------------------------------------------------------- #
resource "aws_lb" "main" {
  name               = "devboard-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]

  enable_deletion_protection = false

  tags = {
    Name        = "devboard-${var.environment}"
    Environment = var.environment
  }
}

# --------------------------------------------------------------------------- #
# HTTP → HTTPS redirect listener
# --------------------------------------------------------------------------- #
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# --------------------------------------------------------------------------- #
# HTTPS listener (default: 404)
# --------------------------------------------------------------------------- #
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.wildcard.arn

  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "Not found"
      status_code  = "404"
    }
  }

  depends_on = [aws_acm_certificate_validation.wildcard]
}

# --------------------------------------------------------------------------- #
# Target groups
# --------------------------------------------------------------------------- #
resource "aws_lb_target_group" "devboard_api" {
  name                 = "devboard-api-${var.environment}"
  port                 = 80
  protocol             = "HTTP"
  vpc_id               = aws_vpc.main.id
  target_type          = "instance"
  deregistration_delay = 30

  health_check {
    path                = "/up"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = {
    Name        = "devboard-api-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "helpdesk_api" {
  name                 = "helpdesk-api-${var.environment}"
  port                 = 80
  protocol             = "HTTP"
  vpc_id               = aws_vpc.main.id
  target_type          = "instance"
  deregistration_delay = 30

  health_check {
    path                = "/up"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = {
    Name        = "helpdesk-api-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "crm_api" {
  name                 = "crm-api-${var.environment}"
  port                 = 80
  protocol             = "HTTP"
  vpc_id               = aws_vpc.main.id
  target_type          = "instance"
  deregistration_delay = 30

  health_check {
    path                = "/up"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = {
    Name        = "crm-api-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "admin_api" {
  name                 = "admin-api-${var.environment}"
  port                 = 80
  protocol             = "HTTP"
  vpc_id               = aws_vpc.main.id
  target_type          = "instance"
  deregistration_delay = 30

  health_check {
    path                = "/up"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = {
    Name        = "admin-api-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "devboard_reverb" {
  name                 = "devboard-reverb-${var.environment}"
  port                 = 8080
  protocol             = "HTTP"
  vpc_id               = aws_vpc.main.id
  target_type          = "instance"
  deregistration_delay = 30

  # Enable stickiness for WebSocket connections
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }

  health_check {
    path                = "/up"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = {
    Name        = "devboard-reverb-${var.environment}"
    Environment = var.environment
  }
}

# --------------------------------------------------------------------------- #
# Listener rules — host-based routing
# --------------------------------------------------------------------------- #
resource "aws_lb_listener_rule" "devboard_api" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.devboard_api.arn
  }

  condition {
    host_header {
      values = ["api.${var.domain}"]
    }
  }
}

resource "aws_lb_listener_rule" "helpdesk_api" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 20

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.helpdesk_api.arn
  }

  condition {
    host_header {
      values = ["helpdesk-api.${var.domain}"]
    }
  }
}

resource "aws_lb_listener_rule" "crm_api" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 30

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.crm_api.arn
  }

  condition {
    host_header {
      values = ["crm-api.${var.domain}"]
    }
  }
}

resource "aws_lb_listener_rule" "admin_api" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 40

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.admin_api.arn
  }

  condition {
    host_header {
      values = ["admin-api.${var.domain}"]
    }
  }
}

resource "aws_lb_listener_rule" "devboard_reverb" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 50

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.devboard_reverb.arn
  }

  condition {
    host_header {
      values = ["ws.${var.domain}"]
    }
  }
}
