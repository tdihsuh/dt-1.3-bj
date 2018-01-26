//增加查询次数 统计查询时间
module.exports = function($) {
  /**
   * 数据统计
   */
  $.get("/api/v1/users/statistics", async (ctx, next) => {
    var self = ctx;
    var status = 201;
    var result = {};
    var user_id = self.request.query.user_id;
    var queryLogModel = self.model('query_log')
    var total = 0 // 查询总数
    var company_total = 0 // 企业查询总数
    var company_hit = 0 // 企业命中总数
    var person_total = 0 // 个人查询总数
    var person_hit = 0 // 个人命中总数

    // 查询总数
    var total = await queryLogModel.count({
      'group_id': {
        $ne: ''
      },
      'user_id': user_id
    });

    // 企业查询总数
    var company_total = await queryLogModel.count({

        'group_id': {
          $ne: ''
        },
        'user_id': user_id,
        'queries.query_type': 1,

      },

    );

    // 企业命中总数
    var company_hit = await queryLogModel.count({

        'group_id': {
          $ne: ''
        },
        'user_id': user_id,
        'queries.query_type': 1,
        'queries.query_status': 1,

      },

    );

    //查询个人的命中
    var person_hit = await queryLogModel.count({

        'group_id': {
          $ne: ''
        },
        'user_id': user_id,
        'queries.query_type': 0,
        'queries.query_status': 1,

      },

    );

    // 个人总数
    var person_total = await queryLogModel.count({

        'group_id': {
          $ne: ''
        },
        'user_id': user_id,
        'queries.query_type': 0

      },

    );

    result = {
      code: 201,
      'detail': {
        'total': company_hit + person_hit,
        'company_total': company_total, // 企业查询总数
        'company_hit': company_hit, // 企业命中总数
        'person_total': person_total, // 个人查询总数
        'person_hit': person_hit // 个人命中总数
      }
    };
    self.status = status;
    self.body = result;
  });

}
